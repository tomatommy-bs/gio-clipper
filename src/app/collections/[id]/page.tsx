"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Hand, MousePointer2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import GeoMapCanvas, { type Transform } from "@/components/map/GeoMapCanvas";
import MapZoomControls from "@/components/map/MapZoomControls";
import RegionEditModal from "@/components/map/RegionEditModal";
import { fetchTemplate } from "@/lib/geo/template-registry";
import { getCollection } from "@/lib/storage/collections-store";
import { useRegionAssignment } from "@/lib/hooks/use-region-assignment";
import { exportCollectionPng } from "@/lib/export/canvas-export";
import type { GeoTemplate } from "@/lib/geo/types";
import type { Collection } from "@/lib/storage/types";

export default function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [template, setTemplate] = useState<GeoTemplate | null>(null);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [editingRegionId, setEditingRegionId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [mapMode, setMapMode] = useState<'edit' | 'pan'>('edit');

  const { assignPhoto, removeAssignment } = useRegionAssignment(id);

  useEffect(() => {
    const col = getCollection(id);
    if (!col) { router.replace("/"); return; }
    setCollection(col);
    fetchTemplate(col.templateId).then(setTemplate).catch(console.error);
  }, [id, router]);

  function refreshCollection() {
    const col = getCollection(id);
    if (col) setCollection({ ...col });
  }

  async function handleSave(
    regionId: string,
    blob: Blob,
    settings: { scale: number; offsetX: number; offsetY: number }
  ) {
    await assignPhoto(regionId, blob, settings);
    refreshCollection();
    setEditingRegionId(null);
  }

  async function handleDelete(regionId: string) {
    await removeAssignment(regionId);
    refreshCollection();
    setEditingRegionId(null);
  }

  async function handleExport() {
    if (!template || !collection) return;
    setExporting(true);
    try {
      await exportCollectionPng(template, collection);
    } finally {
      setExporting(false);
    }
  }

  if (!template || !collection) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        読み込み中...
      </div>
    );
  }

  const visitedCount = Object.keys(collection.assignments).length;
  const totalCount = template.regions.length;
  const editingRegion = editingRegionId
    ? template.regions.find((r) => r.id === editingRegionId) ?? null
    : null;

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/")} className="p-1.5 rounded hover:bg-accent transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm truncate">{collection.name}</h1>
          <p className="text-xs text-muted-foreground">
            {visitedCount} / {totalCount} 訪問済み
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleExport} disabled={exporting}>
          <Download className="w-3.5 h-3.5 mr-1" />
          {exporting ? "書き出し中..." : "エクスポート"}
        </Button>
      </header>

      <div className="flex-1 min-h-0 relative">
        <GeoMapCanvas
          template={template}
          collection={collection}
          transform={transform}
          onTransformChange={setTransform}
          mapMode={mapMode}
          onRegionClick={setEditingRegionId}
        />
        <MapZoomControls transform={transform} onTransformChange={setTransform} />
        <button
          onClick={() => setMapMode(m => m === 'edit' ? 'pan' : 'edit')}
          aria-label={mapMode === 'edit' ? 'パンモードに切り替え' : '編集モードに切り替え'}
          className="absolute bottom-4 left-4 z-10 w-9 h-9 flex items-center justify-center rounded-lg bg-background/90 backdrop-blur border shadow-md hover:bg-accent transition-colors"
        >
          {mapMode === 'edit' ? <Hand className="w-4 h-4" /> : <MousePointer2 className="w-4 h-4" />}
        </button>
      </div>

      {editingRegion && (
        <RegionEditModal
          region={editingRegion}
          existingAssignment={collection.assignments[editingRegion.id] ?? null}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditingRegionId(null)}
        />
      )}
    </div>
  );
}
