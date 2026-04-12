// このモジュールは document.createElement / Canvas / URL.createObjectURL など
// ブラウザ専用 API を直接使用するため、Server Component から誤って import されないよう
// モジュール境界を明示している。
"use client";

import type { GeoTemplate, GeoRegion } from "@/lib/geo/types";
import type { Collection, RegionAssignment } from "@/lib/storage/types";
import { loadPhoto } from "@/lib/storage/photo-db";
import { normalizeRegion, scaledPath } from "@/lib/geo/normalize";

const MIN_LONG_SIDE = 2048;
const MAX_EXPORT_SIZE = 4096;

function formatDate(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function triggerDownload(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

function blobToImageElement(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

/**
 * 単体クリップエクスポート
 * エリアの形状でクリップした写真を背景透過PNGとして書き出す
 */
export async function exportSingleClipPng(
  region: GeoRegion,
  photoBlob: Blob,
  settings: RegionAssignment["photoSettings"]
): Promise<void> {
  const normalized = normalizeRegion(region);

  // 画像を先に読み込み、実際の解像度を出力サイズに反映する
  const img = await blobToImageElement(photoBlob);
  const imgLongEdge = Math.max(img.naturalWidth, img.naturalHeight);
  const outputSize = Math.min(MAX_EXPORT_SIZE, Math.max(MIN_LONG_SIDE, imgLongEdge));

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // クリッピングパス（正規化パスをoutputSizeにスケール）
  const scaledPathStr = scaledPath(normalized.normalizedPath, outputSize, 0);
  const clipPath2D = new Path2D(scaledPathStr);

  // scaledPath(padding=0) のマッピング: normalized[0,1] → [0, outputSize]
  // region の bbox 中心をキャンバス座標系で求める（GeoMapCanvas と同じ基準点）
  const { width: bboxW, height: bboxH } = normalized.originalBbox;
  const bboxSize = Math.max(bboxW, bboxH);
  const shapeCX = (bboxW / (2 * bboxSize)) * outputSize;
  const shapeCY = (bboxH / (2 * bboxSize)) * outputSize;

  ctx.save();
  ctx.clip(clipPath2D);

  const imgSize = outputSize * settings.scale;
  const imgX = shapeCX - imgSize / 2 + settings.offsetX * imgSize;
  const imgY = shapeCY - imgSize / 2 + settings.offsetY * imgSize;
  ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
  ctx.restore();

  triggerDownload(canvas, `${region.name}_${formatDate()}.png`);
}

/**
 * コレクション全体エクスポート
 * 全エリア（訪問済み写真 + 未訪問破線）をマップ全体としてPNG書き出しする
 */
export async function exportCollectionPng(
  template: GeoTemplate,
  collection: Collection
): Promise<void> {
  const { canvasWidth, canvasHeight } = template;

  // 出力解像度（長辺が MIN_LONG_SIDE 以上になるようスケール）
  const scaleFactor = Math.max(1, MIN_LONG_SIDE / Math.max(canvasWidth, canvasHeight));
  const outW = Math.round(canvasWidth * scaleFactor);
  const outH = Math.round(canvasHeight * scaleFactor);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.scale(scaleFactor, scaleFactor);

  for (const region of template.regions) {
    const assignment = collection.assignments[region.id];

    if (assignment) {
      // 訪問済み: 写真をクリップして描画
      const blob = await loadPhoto(assignment.photoKey);
      if (blob) {
        try {
          const img = await blobToImageElement(blob);
          const clipPath2D = new Path2D(region.path);
          const { x, y, width, height } = region.bbox;
          const cx = x + width / 2;
          const cy = y + height / 2;
          const { scale, offsetX, offsetY } = assignment.photoSettings;
          const imgSize = Math.max(width, height) * scale;

          ctx.save();
          ctx.clip(clipPath2D);
          ctx.drawImage(
            img,
            cx - imgSize / 2 + offsetX * imgSize,
            cy - imgSize / 2 + offsetY * imgSize,
            imgSize,
            imgSize
          );
          ctx.restore();
        } catch {
          // 画像読み込み失敗時は破線にフォールバック
        }
      }
    } else {
      // 未訪問: 破線描画
      const pathObj = new Path2D(region.path);
      ctx.save();
      ctx.strokeStyle = "rgba(100,100,100,0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.stroke(pathObj);
      ctx.restore();
    }
  }

  const name = collection.name.replace(/\s+/g, "_");
  triggerDownload(canvas, `${name}_${formatDate()}.png`);
}
