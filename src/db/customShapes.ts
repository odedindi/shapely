import type { CustomShapeRecord } from '@/shapes/types'
import { log } from '@/lib/logger'

const DB_NAME = 'shapely'
const DB_VERSION = 3
const STORE_NAME = 'custom-shapes'
const SEED_KEY = 'shapely-seeded-v1'

const SEED_SHAPES: CustomShapeRecord[] = [
  {
    id: 'custom-1776712880869',
    name: 'blop',
    viewBox: '0 0 100 100',
    svgContent:
      '<circle cx="25" cy="25" r="24" fill="currentColor" opacity="0.3"/>' +
      '<circle cx="75" cy="25" r="24" fill="currentColor" opacity="0.3"/>' +
      '<circle cx="50" cy="55" r="42" fill="currentColor" opacity="0.15"/>' +
      '<circle cx="50" cy="50" r="40" fill="currentColor"/>' +
      '<circle cx="40" cy="40" r="10" fill="white" opacity="0.7"/>' +
      '<circle cx="41" cy="42" r="4" fill="currentColor" opacity="0.6"/>' +
      '<circle cx="60" cy="40" r="10" fill="white" opacity="0.7"/>' +
      '<circle cx="59" cy="42" r="4" fill="currentColor" opacity="0.6"/>',
    createdAt: 1776712880869,
    updatedAt: 1776712880869,
  },
  {
    id: 'custom-seed-arrow',
    name: 'arrow',
    viewBox: '0 0 100 100',
    svgContent:
      '<polygon points="50,10 90,60 65,60 65,90 35,90 35,60 10,60" fill="currentColor"/>',
    createdAt: 1776712880870,
    updatedAt: 1776712880870,
  },
  {
    id: 'custom-seed-cross',
    name: 'cross',
    viewBox: '0 0 100 100',
    svgContent:
      '<rect x="38" y="5" width="24" height="90" rx="4" fill="currentColor"/>' +
      '<rect x="5" y="38" width="90" height="24" rx="4" fill="currentColor"/>',
    createdAt: 1776712880871,
    updatedAt: 1776712880871,
  },
  {
    id: 'custom-seed-moon',
    name: 'moon',
    viewBox: '0 0 100 100',
    svgContent:
      '<path d="M70,15 A40,40 0 1,0 70,85 A28,28 0 1,1 70,15 Z" fill="currentColor"/>',
    createdAt: 1776712880872,
    updatedAt: 1776712880872,
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
      if (e.oldVersion < 3) {
        if (!db.objectStoreNames.contains('shape-mastery')) {
          const masteryStore = db.createObjectStore('shape-mastery', { keyPath: 'combinationId' })
          masteryStore.createIndex('by-lastSeen', 'lastSeenAt', { unique: false })
        }
        if (!db.objectStoreNames.contains('answer-events')) {
          const eventsStore = db.createObjectStore('answer-events', { keyPath: 'id' })
          eventsStore.createIndex('by-combination', 'combinationId', { unique: false })
          eventsStore.createIndex('by-recorded-at', 'recordedAt', { unique: false })
        }
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
