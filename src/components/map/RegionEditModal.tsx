"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, Trash2, Download, ZoomOut, Move } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { normalizeRegion, scaledPath } from "@/lib/geo/normalize";
import { exportSingleClipPng } from "@/lib/export/canvas-export";
import { getPhotoUrl } from "@/lib/storage/photo-db";
import { normalizePhoto } from "@/lib/storage/photo-normalize";
import type { GeoRegion } from "@/lib/geo/types";
import type { RegionAssignment } from "@/lib/storage/types";

const PREVIEW_SIZE = 280;
const PREVIEW_PADDING = 8; // scaledPath のデフォルト padding と同値
const PREVIEW_DRAW = PREVIEW_SIZE - 2 * PREVIEW_PADDING; // 264

interface Props {
  region: GeoRegion;
  existingAssignment: RegionAssignment | null;
  onSave: (regionId: string, blob: Blob, settings: RegionAssignment["photoSettings"]) => Promise<void>;
  onDelete: (regionId: string) => Promise<void>;
  onClose: () => void;
}

function getTouchDist(touches: React.TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function RegionEditModal({ region, existingAssignment, onSave, onDelete, onClose }: Props) {
  const normalized = normalizeRegion(region);
  const displayPath = scaledPath(normalized.normalizedPath, PREVIEW_SIZE);

  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(existingAssignment?.photoSettings.scale ?? 1.5);
  const [offsetX, setOffsetX] = useState(existingAssignment?.photoSettings.offsetX ?? 0);
  const [offsetY, setOffsetY] = useState(existingAssignment?.photoSettings.offsetY ?? 0);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // マウス・タッチ共用のドラッグ開始状態
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  // ピンチ開始状態
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 既存の写真を読み込む
  useEffect(() => {
    if (!existingAssignment) return;
    let url: string | null = null;
    getPhotoUrl(existingAssignment.photoKey).then((u) => {
      if (u) { url = u; setPhotoUrl(u); }
    });
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [existingAssignment]);

  // 新しい写真を選択したとき
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingPhoto(true);
    setPhotoError(null);
    try {
      const normalized = await normalizePhoto(file);
      const url = URL.createObjectURL(normalized);
      setPhotoBlob(normalized);
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      setPhotoUrl(url);
      setOffsetX(0);
      setOffsetY(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "写真の読み込みに失敗しました";
      setPhotoError(message);
    } finally {
      setLoadingPhoto(false);
    }
  }, [photoUrl]);

  // ---- マウス操作 ----
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY };
  }, [offsetX, offsetY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart.current) return;
    const factor = 1 / (PREVIEW_DRAW * scale);
    setOffsetX(dragStart.current.ox + (e.clientX - dragStart.current.x) * factor);
    setOffsetY(dragStart.current.oy + (e.clientY - dragStart.current.y) * factor);
  }, [isDragging, scale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  // ---- タッチ操作 (touch-action:none で preventDefault 不要) ----
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      dragStart.current = { x: touch.clientX, y: touch.clientY, ox: offsetX, oy: offsetY };
      pinchStart.current = null;
    } else if (e.touches.length === 2) {
      pinchStart.current = { dist: getTouchDist(e.touches), scale };
      dragStart.current = null;
    }
  }, [offsetX, offsetY, scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart.current) {
      // ピンチでスケール調整
      const dist = getTouchDist(e.touches);
      setScale(Math.max(0.5, Math.min(4, pinchStart.current.scale * (dist / pinchStart.current.dist))));
    } else if (e.touches.length === 1 && dragStart.current && !pinchStart.current) {
      // 1本指ドラッグで位置調整
      const touch = e.touches[0];
      const factor = 1 / (PREVIEW_DRAW * scale);
      setOffsetX(dragStart.current.ox + (touch.clientX - dragStart.current.x) * factor);
      setOffsetY(dragStart.current.oy + (touch.clientY - dragStart.current.y) * factor);
    }
  }, [scale]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      dragStart.current = null;
      pinchStart.current = null;
    } else if (e.touches.length === 1) {
      // ピンチ終了後、1本指ドラッグを再開できるよう再初期化
      pinchStart.current = null;
      const touch = e.touches[0];
      dragStart.current = { x: touch.clientX, y: touch.clientY, ox: offsetX, oy: offsetY };
    }
  }, [offsetX, offsetY]);

  async function handleSave() {
    if (!photoUrl) return;
    setSaving(true);
    try {
      let blob = photoBlob;
      if (!blob && existingAssignment) {
        const { loadPhoto } = await import("@/lib/storage/photo-db");
        const existing = await loadPhoto(existingAssignment.photoKey);
        if (existing) blob = existing;
      }
      if (!blob) return;
      await onSave(region.id, blob, { scale, offsetX, offsetY });
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload() {
    if (!photoUrl || !photoBlob) return;
    await exportSingleClipPng(region, photoBlob, { scale, offsetX, offsetY });
  }

  // region の bbox 中心をプレビュー座標系で求める（scaledPath のマッピングに合わせる）
  const { width: bboxW, height: bboxH } = normalized.originalBbox;
  const bboxSize = Math.max(bboxW, bboxH);
  const shapeCX = (bboxW / (2 * bboxSize)) * PREVIEW_DRAW + PREVIEW_PADDING;
  const shapeCY = (bboxH / (2 * bboxSize)) * PREVIEW_DRAW + PREVIEW_PADDING;
  // imgSize: GeoMapCanvas / exportCollectionPng と同じ「size を基準にしたスケール」
  const imgSize = scale * PREVIEW_DRAW;
  const imgX = shapeCX - imgSize / 2 + offsetX * imgSize;
  const imgY = shapeCY - imgSize / 2 + offsetY * imgSize;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{region.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* プレビュー — touch-none でブラウザのスクロール・ズームを抑制 */}
          <div
            className="mx-auto relative overflow-hidden rounded border bg-[repeating-conic-gradient(#80808020_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] touch-none cursor-move select-none"
            style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <svg width={PREVIEW_SIZE} height={PREVIEW_SIZE} className="absolute inset-0">
              <defs>
                <clipPath id="modal-clip">
                  <path d={displayPath} />
                </clipPath>
              </defs>
              {photoUrl && (
                <image
                  href={photoUrl}
                  x={imgX}
                  y={imgY}
                  width={imgSize}
                  height={imgSize}
                  preserveAspectRatio="xMidYMid slice"
                  clipPath="url(#modal-clip)"
                />
              )}
              <path d={displayPath} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-border" />
            </svg>
            {!photoUrl && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50 pointer-events-none">
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-xs">写真を選択</span>
              </div>
            )}
          </div>

          {photoUrl && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground justify-center">
              <Move className="w-3 h-3" />ドラッグで位置調整
            </p>
          )}

          {/* ファイル選択 */}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <Button variant="outline" size="sm" className="w-full" disabled={loadingPhoto} onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3.5 h-3.5 mr-1" />
            {loadingPhoto ? "読み込み中..." : photoUrl ? "写真を変更" : "写真を選択"}
          </Button>
          {photoError && (
            <p className="text-xs text-destructive text-center">{photoError}</p>
          )}

          {/* スケール調整 */}
          {photoUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><ZoomOut className="w-3 h-3" />サイズ</span>
                <span>{Math.round(scale * 100)}%</span>
              </div>
              <Slider
                value={[scale]}
                onValueChange={(v) => { const val = Array.isArray(v) ? v[0] : v; if (typeof val === "number") setScale(val); }}
                min={0.5}
                max={4}
                step={0.05}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <div className="flex gap-2 w-full sm:w-auto">
            {existingAssignment && (
              <Button variant="outline" size="sm" onClick={() => onDelete(region.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5 mr-1" />削除
              </Button>
            )}
            {photoUrl && photoBlob && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-3.5 h-3.5 mr-1" />この1枚
              </Button>
            )}
          </div>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={onClose}>キャンセル</Button>
            <Button size="sm" onClick={handleSave} disabled={!photoUrl || saving || loadingPhoto}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
