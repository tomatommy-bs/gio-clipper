"use client";

import { useRef, useState, useCallback, useEffect } from "react";
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
  onRegionClick: (regionId: string) => void;
}

interface PhotoUrls {
  [regionId: string]: string;
}

export default function GeoMapCanvas({ template, collection, transform, onTransformChange, onRegionClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const hasDragged = useRef(false);
  const [photoUrls, setPhotoUrls] = useState<PhotoUrls>({});

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
      className="w-full h-full overflow-hidden relative cursor-grab active:cursor-grabbing select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
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
              onClick={() => { if (!hasDragged.current) onRegionClick(region.id); }}
              onMouseEnter={() => { if (!isPanning) setHoveredRegionId(region.id); }}
              onMouseLeave={() => setHoveredRegionId(null)}
              className="cursor-pointer"
            >
              {visited ? (
                <g clipPath={`url(#clip-${region.id})`}>
                  <image
                    href={photoUrl}
                    x={cx - (Math.max(width, height) * assignment.photoSettings.scale) / 2 + assignment.photoSettings.offsetX}
                    y={cy - (Math.max(width, height) * assignment.photoSettings.scale) / 2 + assignment.photoSettings.offsetY}
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
