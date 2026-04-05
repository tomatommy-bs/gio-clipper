"use client";

import { useState, useEffect } from "react";
import { Plus, Map, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCollections } from "@/lib/hooks/use-collections";
import type { GeoTemplateGroup } from "@/lib/geo/types";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const { collections, createCollection, removeCollection } = useCollections();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [groups, setGroups] = useState<GeoTemplateGroup[]>([]);

  useEffect(() => {
    fetch("/api/template-groups")
      .then((res) => res.json())
      .then((data: GeoTemplateGroup[]) => setGroups(data))
      .catch(console.error);
  }, []);

  function handleCreate() {
    if (!selectedTemplateId) return;
    const info = groups.flatMap((g) => g.templates).find((t) => t.id === selectedTemplateId);
    if (!info) return;
    const col = createCollection(selectedTemplateId, info.name);
    setCreateOpen(false);
    setSelectedTemplateId("");
    router.push(`/collections/${col.id}`);
  }

  async function handleDelete(id: string) {
    await removeCollection(id);
    setDeleteTarget(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">geo travel album</h1>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          新しいコレクション
        </Button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {collections.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Map className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">まだコレクションがありません</p>
            <p className="text-xs mt-1">「新しいコレクション」から始めましょう</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {collections.map((col) => {
              const visitedCount = Object.keys(col.assignments).length;
              return (
                <li key={col.id} className="border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                  <button
                    className="w-full flex items-center gap-4 px-4 py-4 text-left"
                    onClick={() => router.push(`/collections/${col.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{col.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {visitedCount} エリア訪問済み
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(col.id); }}
                        aria-label="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {/* 新規作成ダイアログ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>コレクションを作成</DialogTitle>
          </DialogHeader>
          <div className="py-2 max-h-[60vh] overflow-y-auto">
            <Accordion type="multiple" className="w-full">
              {groups.map((group) => (
                <AccordionItem key={group.id} value={group.id}>
                  <AccordionTrigger className="text-sm font-medium">
                    {group.name}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 pt-1">
                      {group.templates.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTemplateId(t.id)}
                          className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                            selectedTemplateId === t.id
                              ? "border-primary bg-primary/5 font-medium"
                              : "border-border hover:bg-accent/50"
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>キャンセル</Button>
            <Button onClick={handleCreate} disabled={!selectedTemplateId}>作成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>コレクションを削除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            このコレクションと割り当てた写真をすべて削除します。この操作は取り消せません。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>キャンセル</Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)}>削除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
