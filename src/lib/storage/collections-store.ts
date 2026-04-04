"use client";

import type { Collection } from "./types";

const STORAGE_KEY = "geo-travel-album:collections";

function load(): Collection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Collection[]) : [];
  } catch {
    return [];
  }
}

function save(collections: Collection[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
}

export function getAllCollections(): Collection[] {
  return load();
}

export function getCollection(id: string): Collection | null {
  return load().find((c) => c.id === id) ?? null;
}

export function upsertCollection(collection: Collection): void {
  const all = load();
  const idx = all.findIndex((c) => c.id === collection.id);
  if (idx >= 0) {
    all[idx] = collection;
  } else {
    all.push(collection);
  }
  save(all);
}

export function deleteCollection(id: string): void {
  save(load().filter((c) => c.id !== id));
}
