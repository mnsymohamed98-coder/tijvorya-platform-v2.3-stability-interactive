const DB_NAME = "tijvorya-media";
const STORE_NAME = "files";
const PREFIX = "idb://";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open media storage"));
  });
}

export function isStoredMedia(value?: string): boolean {
  return Boolean(value?.startsWith(PREFIX));
}

export async function storeLocalMedia(file: File): Promise<string> {
  const key = `${Date.now()}-${crypto.randomUUID()}-${file.name}`;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(file, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Unable to store media"));
  });
  db.close();
  return `${PREFIX}${key}`;
}

export async function resolveStoredMedia(value: string): Promise<Blob | null> {
  if (!isStoredMedia(value)) return null;
  const key = value.slice(PREFIX.length);
  const db = await openDb();
  const result = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("Unable to read media"));
  });
  db.close();
  return result;
}
