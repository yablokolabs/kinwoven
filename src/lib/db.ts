import type { MediaAsset, Memory } from '../types';
import { assertExpectedRevision } from './concurrency';

const DB_NAME = 'kinwoven';
const DB_VERSION = 1;
const MEMORIES = 'memories';
const MEDIA = 'media';

let dbPromise: Promise<IDBDatabase> | null = null;

export function openKinwovenDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(MEMORIES)) {
          db.createObjectStore(MEMORIES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(MEDIA)) {
          db.createObjectStore(MEDIA, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Could not open local storage.'));
    });
  }
  return dbPromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Local storage request failed.'));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Local storage transaction failed.'));
    tx.onabort = () => reject(tx.error ?? new Error('Local storage transaction was aborted.'));
  });
}

/**
 * Saves a memory only if the stored revision still equals `expectedRevision`.
 * An unknown memory must be saved with an expected revision of 0.
 */
export async function putMemory(memory: Memory, expectedRevision: number): Promise<Memory> {
  const db = await openKinwovenDb();
  const tx = db.transaction(MEMORIES, 'readwrite');
  const store = tx.objectStore(MEMORIES);
  const existing = (await requestToPromise(store.get(memory.id))) as Memory | undefined;
  assertExpectedRevision(existing?.revision ?? 0, expectedRevision);
  const stored: Memory = { ...memory, updatedAt: Date.now() };
  store.put(stored);
  await transactionDone(tx);
  return stored;
}

export async function getMemory(id: string): Promise<Memory | undefined> {
  const db = await openKinwovenDb();
  const tx = db.transaction(MEMORIES, 'readonly');
  return (await requestToPromise(tx.objectStore(MEMORIES).get(id))) as Memory | undefined;
}

export async function listMemories(): Promise<Memory[]> {
  const db = await openKinwovenDb();
  const tx = db.transaction(MEMORIES, 'readonly');
  const all = (await requestToPromise(tx.objectStore(MEMORIES).getAll())) as Memory[];
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveMedia(asset: MediaAsset): Promise<void> {
  const db = await openKinwovenDb();
  const tx = db.transaction(MEDIA, 'readwrite');
  tx.objectStore(MEDIA).put(asset);
  await transactionDone(tx);
}

export async function getMedia(id: string): Promise<MediaAsset | undefined> {
  const db = await openKinwovenDb();
  const tx = db.transaction(MEDIA, 'readonly');
  return (await requestToPromise(tx.objectStore(MEDIA).get(id))) as MediaAsset | undefined;
}

export async function deleteMemory(id: string): Promise<void> {
  const db = await openKinwovenDb();
  const tx = db.transaction([MEMORIES, MEDIA], 'readwrite');
  const memories = tx.objectStore(MEMORIES);
  const existing = (await requestToPromise(memories.get(id))) as Memory | undefined;
  memories.delete(id);
  if (existing?.photoId) {
    tx.objectStore(MEDIA).delete(existing.photoId);
  }
  await transactionDone(tx);
}
