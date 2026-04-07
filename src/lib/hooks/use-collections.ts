"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Collection } from "@/lib/storage/types";
import {
  getAllCollections,
  getCollection,
  upsertCollection,
  deleteCollection,
} from "@/lib/storage/collections-store";
import { deletePhoto } from "@/lib/storage/photo-db";

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>(() => getAllCollections());

  const refresh = useCallback(() => {
    setCollections(getAllCollections());
  }, []);

  const createCollection = useCallback(
    (templateId: string, name: string): Collection => {
      const now = Date.now();
      const collection: Collection = {
        id: uuidv4(),
        templateId,
        name,
        createdAt: now,
        updatedAt: now,
        assignments: {},
      };
      upsertCollection(collection);
      refresh();
      return collection;
    },
    [refresh]
  );

  const removeCollection = useCallback(
    async (id: string) => {
      const col = getCollection(id);
      if (col) {
        // 紐づく写真を IndexedDB から削除
        await Promise.all(
          Object.values(col.assignments).map((a) => deletePhoto(a.photoKey))
        );
      }
      deleteCollection(id);
      refresh();
    },
    [refresh]
  );

  return { collections, createCollection, removeCollection, refresh };
}
