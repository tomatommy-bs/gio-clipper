"use client";

import { useRef, useState, useCallback, useEffect, useLayoutEffect } from "react";
import type { GeoTemplate } from "@/lib/geo/types";
import type { Collection } from "@/lib/storage/types";
import { getPhotoUrl } from "@/lib/storage/photo-db";

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

interface Props {
  template: GeoTemplate;
  collection: Collection;
  transform: Transform;
  onTransformChange: (t: Transform) => void;
  mapMode: 'edit' | 'pan';
  onRegionClick: (regionId: string) => void;
}

interface PhotoUrls {
  [regionId: string]: string;
}

function getTouchDist(touches: TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function GeoMapCanvas({ template, collection, transform, onTransformChange, mapMode, onRegionClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // 1.1
  const [isPanning, setIsPanning] = useState(false);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const hasDragged = useRef(false);
  const touchStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const touchHasDragged = useRef(false);
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null); // 1.5
  const [photoUrls, setPhotoUrls] = useState<PhotoUrls>({});

  // 最新の transform / callback を ref で保持してタッチハンドラから参照する
  const transformRef = useRef(transform);
  const onTransformChangeRef = useRef(onTransformChange);
  const mapModeRef = useRef(mapMode);
  const onRegionClickRef = useRef(onRegionClick);
  useLayoutEffect(() => {
    transformRef.current = transform;
    onTransformChangeRef.current = onTransformChange;
    mapModeRef.current = mapMode;
    onRegionClickRef.current = onRegionClick;
  });

  // 割り当て済みエリアの写真URLを読み込む
  useEffect(() => {
    const assignments = collection.assignments;
    const regionIds = Object.keys(assignments);

    let cancelled = false;
    const urls: PhotoUrls = {};

    Promise.all(
      regionIds.map(async (rid) => {
        const url = await getPhotoUrl(assignments[rid].photoKey);
        if (url) urls[rid] = url;
      })
    ).then(() => {
      if (!cancelled) setPhotoUrls(urls);
    });

    return () => {
      cancelled = true;
      Object.values(urls).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [collection]);

  // ネイティブタッチイベント登録 (passive: false でブラウザズームを抑制) — 1.2, 1.3
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleTouchStart(e: TouchEvent) {
      const t = transformRef.current;
      if (e.touches.length === 1) {
        // 1本指パン開始
        const touch = e.touches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY, tx: t.x, ty: t.y };
        touchHasDragged.current = false;
        pinchStart.current = null;
      } else if (e.touches.length === 2) {
        // 2本指ピンチ開始 — 1.5
        pinchStart.current = { dist: getTouchDist(e.touches), scale: t.scale };
        touchStart.current = null; // パンを無効化
      }
    }

    function handleTouchMove(e: TouchEvent) {
      e.preventDefault(); // ブラウザズーム・スクロール抑制 — 1.6
      const t = transformRef.current;

      if (e.touches.length === 2 && pinchStart.current) {
        // 2本指ピンチ — 1.5
        const dist = getTouchDist(e.touches);
        const newScale = Math.max(0.3, Math.min(20, pinchStart.current.scale * (dist / pinchStart.current.dist)));
        onTransformChangeRef.current({ ...t, scale: newScale });
      } else if (e.touches.length === 1 && touchStart.current && !pinchStart.current) {
        // 1本指パン — 1.4
        const touch = e.touches[0];
        const dx = touch.clientX - touchStart.current.x;
        const dy = touch.clientY - touchStart.current.y;
        if (!touchHasDragged.current && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
          touchHasDragged.current = true;
        }
        onTransformChangeRef.current({ ...t, x: touchStart.current.tx + dx, y: touchStart.current.ty + dy });
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      // 1.7: タップ判定 (ドラッグなし & edit モード)
      if (!touchHasDragged.current && mapModeRef.current === 'edit' && touchStart.current) {
        const touch = e.changedTouches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const g = el?.closest<SVGGElement>('g[data-region-id]');
        if (g?.dataset.regionId) onRegionClickRef.current(g.dataset.regionId);
      }
      // 1.7: 指の本数に応じてリセット
      if (e.touches.length === 0) {
        touchStart.current = null;
        touchHasDragged.current = false;
        pinchStart.current = null;
      } else if (e.touches.length === 1) {
        // ピンチ終了後に1本指パンを再開できるよう再初期化
        pinchStart.current = null;
        const touch = e.touches[0];
        const t = transformRef.current;
        touchStart.current = { x: touch.clientX, y: touch.clientY, tx: t.x, ty: t.y };
        touchHasDragged.current = false;
      }
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: false });
    el.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []); // マウント時のみ登録。transform は ref 経由で参照する

  // ホイールでズーム
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    onTransformChange({
      ...transform,
      scale: Math.max(0.3, Math.min(20, transform.scale * factor)),
    });
  }, [transform, onTransformChange]);

  // マウスでパン
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    hasDragged.current = false;
    panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    if (!isPanning || !panStart.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    if (!hasDragged.current && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      hasDragged.current = true;
    }
    onTransformChange({
      ...transform,
      x: panStart.current.tx + dx,
      y: panStart.current.ty + dy,
    });
  }, [isPanning, transform, onTransformChange]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    panStart.current = null;
  }, []);

  const { canvasWidth, canvasHeight, regions } = template;

  return (
    <div
      ref={containerRef} // 1.1
      className="w-full h-full overflow-hidden relative cursor-grab active:cursor-grabbing select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      // onTouchStart / onTouchMove / onTouchEnd / onTouchCancel は削除 — 1.2
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        className="w-full h-full"
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: "center" }}
      >
        <defs>
          {regions.map((region) => {
            const assignment = collection.assignments[region.id];
            if (!assignment || !photoUrls[region.id]) return null;
            return (
              <clipPath key={region.id} id={`clip-${region.id}`}>
                <path d={region.path} />
              </clipPath>
            );
          })}
        </defs>

        {regions.map((region) => {
          const assignment = collection.assignments[region.id];
          const photoUrl = photoUrls[region.id];
          const visited = !!assignment && !!photoUrl;
          const { x, y, width, height } = region.bbox;
          const cx = x + width / 2;
          const cy = y + height / 2;

          return (
            <g
              key={region.id}
              data-region-id={region.id}
              onClick={() => { if (mapMode === 'edit' && !hasDragged.current) onRegionClick(region.id); }}
              onMouseEnter={() => { if (!isPanning) setHoveredRegionId(region.id); }}
              onMouseLeave={() => setHoveredRegionId(null)}
              className="cursor-pointer"
            >
              {visited ? (
                <g clipPath={`url(#clip-${region.id})`}>
                  <image
                    href={photoUrl}
                    x={cx - (Math.max(width, height) * assignment.photoSettings.scale) / 2 + assignment.photoSettings.offsetX * (Math.max(width, height) * assignment.photoSettings.scale)}
                    y={cy - (Math.max(width, height) * assignment.photoSettings.scale) / 2 + assignment.photoSettings.offsetY * (Math.max(width, height) * assignment.photoSettings.scale)}
                    width={Math.max(width, height) * assignment.photoSettings.scale}
                    height={Math.max(width, height) * assignment.photoSettings.scale}
                    preserveAspectRatio="xMidYMid slice"
                  />
                  <path
                    d={region.path}
                    fill="transparent"
                    stroke="white"
                    strokeWidth={0.5}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                  />
                </g>
              ) : (
                <path
                  d={region.path}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                  className="text-muted-foreground/40 hover:text-primary/60 transition-colors"
                />
              )}
            </g>
          );
        })}
      </svg>

      {hoveredRegionId && mousePos && (() => {
        const region = regions.find(r => r.id === hoveredRegionId);
        if (!region) return null;
        return (
          <div
            className="absolute pointer-events-none z-20 px-2 py-1 rounded bg-background/90 backdrop-blur border shadow-sm text-xs font-medium text-foreground"
            style={{ left: mousePos.x + 14, top: mousePos.y + 14 }}
          >
            {region.name}
          </div>
        );
      })()}
    </div>
  );
}
