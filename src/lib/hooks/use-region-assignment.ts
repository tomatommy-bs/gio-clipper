"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Collection, RegionAssignment } from "@/lib/storage/types";
import { getCollection, upsertCollection } from "@/lib/storage/collections-store";
import { savePhoto, deletePhoto } from "@/lib/storage/photo-db";

export function useRegionAssignment(collectionId: string) {
  const [, forceUpdate] = useState(0);

  const getAssignment = useCallback(
    (regionId: string): RegionAssignment | null => {
      const col = getCollection(collectionId);
      return col?.assignments[regionId] ?? null;
    },
    [collectionId]
  );

  const assignPhoto = useCallback(
    async (
      regionId: string,
      photoBlob: Blob,
      settings: RegionAssignment["photoSettings"]
    ) => {
      const col = getCollection(collectionId);
      if (!col) throw new Error(`Collection not found: ${collectionId}`);

      // 既存の写真があれば削除
      const existing = col.assignments[regionId];
      if (existing) await deletePhoto(existing.photoKey);

      const photoKey = `photo:${collectionId}:${regionId}:${uuidv4()}`;
      await savePhoto(photoKey, photoBlob);

      const updated: Collection = {
        ...col,
        updatedAt: Date.now(),
        assignments: {
          ...col.assignments,
          [regionId]: { regionId, photoKey, photoSettings: settings },
        },
      };
      upsertCollection(updated);
      forceUpdate((n) => n + 1);
    },
    [collectionId]
  );

  const updateSettings = useCallback(
    (regionId: string, settings: RegionAssignment["photoSettings"]) => {
      const col = getCollection(collectionId);
      if (!col?.assignments[regionId]) return;
      const updated: Collection = {
        ...col,
        updatedAt: Date.now(),
        assignments: {
          ...col.assignments,
          [regionId]: { ...col.assignments[regionId], photoSettings: settings },
        },
      };
      upsertCollection(updated);
      forceUpdate((n) => n + 1);
    },
    [collectionId]
  );

  const removeAssignment = useCallback(
    async (regionId: string) => {
      const col = getCollection(collectionId);
      if (!col) return;
      const existing = col.assignments[regionId];
      if (existing) await deletePhoto(existing.photoKey);
      const assignments = { ...col.assignments };
      delete assignments[regionId];
      const rest = assignments;
      const updated: Collection = {
        ...col,
        updatedAt: Date.now(),
        assignments: rest,
      };
      upsertCollection(updated);
      forceUpdate((n) => n + 1);
    },
    [collectionId]
  );

  return { getAssignment, assignPhoto, updateSettings, removeAssignment };
}
