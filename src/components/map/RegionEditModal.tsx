"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, Trash2, Download, ZoomIn, ZoomOut, Move } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { normalizeRegion, scaledPath } from "@/lib/geo/normalize";
import { exportSingleClipPng } from "@/lib/export/canvas-export";
import { getPhotoUrl } from "@/lib/storage/photo-db";
import type { GeoRegion } from "@/lib/geo/types";
import type { RegionAssignment } from "@/lib/storage/types";

const PREVIEW_SIZE = 280;

interface Props {
  region: GeoRegion;
  existingAssignment: RegionAssignment | null;
  onSave: (regionId: string, blob: Blob, settings: RegionAssignment["photoSettings"]) => Promise<void>;
  onDelete: (regionId: string) => Promise<void>;
  onClose: () => void;
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
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
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
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoBlob(file);
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(url);
    setOffsetX(0);
    setOffsetY(0);
  }, [photoUrl]);

  // ドラッグで位置調整
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY };
  }, [offsetX, offsetY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart.current) return;
    // スケール係数を考慮してピクセル変化量を正規化
    const factor = 1 / (PREVIEW_SIZE * scale);
    setOffsetX(dragStart.current.ox + (e.clientX - dragStart.current.x) * factor);
    setOffsetY(dragStart.current.oy + (e.clientY - dragStart.current.y) * factor);
  }, [isDragging, scale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  async function handleSave() {
    if (!photoUrl) return;
    setSaving(true);
    try {
      let blob = photoBlob;
      if (!blob && existingAssignment) {
        // 写真は変えず設定のみ更新 → 既存 blob を再取得
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

  // プレビュー表示用の画像座標
  const imgSize = PREVIEW_SIZE * scale;
  const imgX = PREVIEW_SIZE / 2 - imgSize / 2 + offsetX * PREVIEW_SIZE * scale;
  const imgY = PREVIEW_SIZE / 2 - imgSize / 2 + offsetY * PREVIEW_SIZE * scale;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{region.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* プレビュー */}
          <div
            className="mx-auto relative cursor-move overflow-hidden rounded border bg-[repeating-conic-gradient(#80808020_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]"
            style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
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
          <Button variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3.5 h-3.5 mr-1" />
            {photoUrl ? "写真を変更" : "写真を選択"}
          </Button>

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
            <Button size="sm" onClick={handleSave} disabled={!photoUrl || saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
