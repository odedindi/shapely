import { log } from '@/lib/logger'

export interface LeaderboardEntry {
  id: string
  name: string
  score: number
  timeElapsed: number
  accuracy: number
  streak: number
  gridSize: number
  gameMode: string
  recordedAt: number
}

const DB_NAME = 'shapely'
const DB_VERSION = 3
const STORE_NAME = 'leaderboard'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('custom-shapes')) {
        db.createObjectStore('custom-shapes', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
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

function tx(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME)
}

export async function saveLeaderboardEntry(entry: LeaderboardEntry): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').put(entry)
    req.onsuccess = () => {
      log.game.info('leaderboard entry saved', { entry })
      resolve()
    }
    req.onerror = () => reject(req.error)
  })
}

export async function getLeaderboardEntries(filter?: {
  gridSize?: number
  gameMode?: string
}): Promise<LeaderboardEntry[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const store = tx(db, 'readonly')
    const index = store.index('by-score')
    const req = index.openCursor(null, 'prev')
    const results: LeaderboardEntry[] = []

    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor) {
        const entry = cursor.value as LeaderboardEntry
        let match = true
        if (filter?.gridSize !== undefined && entry.gridSize !== filter.gridSize) {
          match = false
        }
        if (filter?.gameMode !== undefined && entry.gameMode !== filter.gameMode) {
          match = false
        }
        if (match) {
          results.push(entry)
        }
        cursor.continue()
      } else {
        results.sort((a, b) => b.score - a.score)
        resolve(results)
      }
    }
    req.onerror = () => reject(req.error)
  })
}

export async function getTopN(
  n: number,
  filter?: { gridSize?: number; gameMode?: string }
): Promise<LeaderboardEntry[]> {
  const all = await getLeaderboardEntries(filter)
  return all.slice(0, n)
}

export async function clearLeaderboard(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').clear()
    req.onsuccess = () => {
      log.game.info('leaderboard cleared')
      resolve()
    }
    req.onerror = () => reject(req.error)
  })
}
