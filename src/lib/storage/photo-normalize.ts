"use client";

const MAX_LONG_EDGE = 4096;

/**
 * File を Canvas 経由で PNG Blob に正規化する。
 *
 * - Android Google Photos のクラウド写真: img.onload で実データのダウンロード完了を待つ
 * - HEIC 等の非対応フォーマット: Canvas 経由で PNG に変換
 * - 長辺 4096px 超の画像: アスペクト比を保ってリサイズ
 * - PNG（ロスレス）で保存するためファイルサイズは増加するが画質劣化なし
 */
export function normalizePhoto(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const { naturalWidth: w, naturalHeight: h } = img;
      const longEdge = Math.max(w, h);
      const scale = longEdge > MAX_LONG_EDGE ? MAX_LONG_EDGE / longEdge : 1;
      const dw = Math.round(w * scale);
      const dh = Math.round(h * scale);

      const canvas = document.createElement("canvas");
      canvas.width = dw;
      canvas.height = dh;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context を取得できませんでした"));
        return;
      }

      ctx.drawImage(img, 0, 0, dw, dh);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas から Blob への変換に失敗しました"));
          }
        },
        "image/png"
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("画像の読み込みに失敗しました。対応していない形式か、ファイルが破損している可能性があります。"));
    };

    img.src = objectUrl;
  });
}
