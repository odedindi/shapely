import type { CustomShapeRecord } from '@/shapes/types'
import { log } from '@/lib/logger'

const DB_NAME = 'shapely'
const DB_VERSION = 2
const STORE_NAME = 'custom-shapes'
const SEED_KEY = 'shapely-seeded-v1'

const SEED_SHAPES: CustomShapeRecord[] = [
  {
    id: 'custom-1776712880869',
    name: 'blop',
    svgContent: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n\n  <circle cx="25" cy="25" r="24" fill="var(--color-primary-fg)"/>\n  <circle cx="75" cy="25" r="24" fill="var(--color-primary-fg)"/>\n  <circle cx="25" cy="25" r="14" fill="currentColor"/>\n  <circle cx="75" cy="25" r="14" fill="currentColor"/>\n\n  <circle cx="50" cy="55" r="42" fill="var(--color-primary-fg)"/>\n  <circle cx="50" cy="50" r="40" fill="currentColor"/>\n\n  <circle cx="40" cy="40" r="10" fill="var(--color-content)"/>\n  <circle cx="41" cy="42" r="4" fill="var(--color-primary-fg)"/>\n\n  <circle cx="60" cy="40" r="10" fill="var(--color-content)"/>\n  <circle cx="59" cy="42" r="4" fill="var(--color-primary-fg)"/>\n\n</svg>',
    createdAt: 1776712880869,
    updatedAt: 1776712880869,
  },
]

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('leaderboard')) {
        const store = db.createObjectStore('leaderboard', { keyPath: 'id' })
        store.createIndex('by-score', 'score', { unique: false })
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

export async function seedDefaultShapes(): Promise<void> {
  if (localStorage.getItem(SEED_KEY)) return
  try {
    const db = await openDB()
    const existing = await new Promise<CustomShapeRecord[]>((resolve, reject) => {
      const req = tx(db, 'readonly').getAll()
      req.onsuccess = () => resolve(req.result as CustomShapeRecord[])
      req.onerror = () => reject(req.error)
    })
    const existingIds = new Set(existing.map((r) => r.id))
    const store = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME)
    await Promise.all(
      SEED_SHAPES.filter((s) => !existingIds.has(s.id)).map(
        (s) => new Promise<void>((resolve, reject) => {
          const req = store.put(s)
          req.onsuccess = () => resolve()
          req.onerror = () => reject(req.error)
        })
      )
    )
    localStorage.setItem(SEED_KEY, '1')
    log.ui.info('seeded default custom shapes', { count: SEED_SHAPES.length })
  } catch (err) {
    log.ui.error('failed to seed default shapes', err)
  }
}
