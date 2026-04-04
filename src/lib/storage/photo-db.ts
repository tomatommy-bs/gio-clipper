"use client";

const DB_NAME = "geo-travel-album";
const DB_VERSION = 1;
const STORE_NAME = "photos";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** 写真バイナリを保存し、キーを返す */
export async function savePhoto(key: string, blob: Blob): Promise<string> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).put(blob, key);
    req.onsuccess = () => resolve(key);
    req.onerror = () => reject(req.error);
  });
}

/** 写真バイナリを取得する */
export async function loadPhoto(key: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
}

/** 写真バイナリを削除する */
export async function deletePhoto(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/** 写真キーから Object URL を生成する（使い終わったら revokeObjectURL すること） */
export async function getPhotoUrl(key: string): Promise<string | null> {
  const blob = await loadPhoto(key);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}
