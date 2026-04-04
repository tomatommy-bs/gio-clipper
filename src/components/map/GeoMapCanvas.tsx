"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { GeoTemplate } from "@/lib/geo/types";
import type { Collection } from "@/lib/storage/types";
import { getPhotoUrl } from "@/lib/storage/photo-db";

interface Props {
  template: GeoTemplate;
  collection: Collection;
  onRegionClick: (regionId: string) => void;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

interface PhotoUrls {
  [regionId: string]: string;
}

export default function GeoMapCanvas({ template, collection, onRegionClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
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
    setTransform((prev) => {
      const newScale = Math.max(0.3, Math.min(20, prev.scale * factor));
      return { ...prev, scale: newScale };
    });
  }, []);

  // マウスでパン
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || !panStart.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setTransform((prev) => ({ ...prev, x: panStart.current!.tx + dx, y: panStart.current!.ty + dy }));
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    panStart.current = null;
  }, []);

  const { canvasWidth, canvasHeight, regions } = template;

  return (
    <div
      className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
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
            const { scale, offsetX, offsetY } = assignment.photoSettings;
            const { x, y, width, height } = region.bbox;
            const cx = x + width / 2;
            const cy = y + height / 2;
            const imgSize = Math.max(width, height) * scale;
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
              onClick={() => onRegionClick(region.id)}
              className="cursor-pointer"
            >
              {visited ? (
                // 訪問済み: 写真クリップ表示
                <g clipPath={`url(#clip-${region.id})`}>
                  <image
                    href={photoUrl}
                    x={cx - (Math.max(width, height) * assignment.photoSettings.scale) / 2 + assignment.photoSettings.offsetX}
                    y={cy - (Math.max(width, height) * assignment.photoSettings.scale) / 2 + assignment.photoSettings.offsetY}
                    width={Math.max(width, height) * assignment.photoSettings.scale}
                    height={Math.max(width, height) * assignment.photoSettings.scale}
                    preserveAspectRatio="xMidYMid slice"
                  />
                  {/* ホバー時の枠線 */}
                  <path
                    d={region.path}
                    fill="transparent"
                    stroke="white"
                    strokeWidth={0.5}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                  />
                </g>
              ) : (
                // 未訪問: 破線プレースホルダー
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
    </div>
  );
}
