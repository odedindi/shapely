import type { CustomShapeRecord } from '@/shapes/types'

const DB_NAME = 'shapely'
const DB_VERSION = 1
const STORE_NAME = 'custom-shapes'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function tx(
  db: IDBDatabase,
  mode: IDBTransactionMode
): IDBObjectStore {
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME)
}

export async function saveCustomShape(shape: CustomShapeRecord): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').put(shape)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function getAllCustomShapes(): Promise<CustomShapeRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readonly').getAll()
    req.onsuccess = () => resolve(req.result as CustomShapeRecord[])
    req.onerror = () => reject(req.error)
  })
}

export async function deleteCustomShape(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function getCustomShape(id: string): Promise<CustomShapeRecord | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readonly').get(id)
    req.onsuccess = () => resolve(req.result as CustomShapeRecord | undefined)
    req.onerror = () => reject(req.error)
  })
}
