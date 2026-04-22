import { log } from '@/lib/logger'

export interface ShapeMastery {
  combinationId: string          // `${colShapeId}::${rowShapeId}`
  totalAttempts: number
  correctAttempts: number
  recentResponseTimes: number[]  // last 10, outliers >10000ms removed
  averageResponseTime: number    // EMA with alpha=0.3
  bestResponseTime: number       // personal best (correct answers only), 0 = none yet
  lastSeenAt: number
  firstSeenAt: number
  streakOnCombo: number
}

export interface AnswerEvent {
  id: string
  combinationId: string          // `${colShapeId}::${rowShapeId}`
  colShapeId: string
  rowShapeId: string
  correct: boolean
  responseTimeMs: number
  recordedAt: number
  boardContext: {
    gridSize: number
    columnShapeIds: string[]
    rowShapeIds: string[]
    correctCol: number
    correctRow: number
    totalSolvedAtTime: number    // cells already solved when this card appeared
  }
}

const DB_NAME = 'shapely'
const DB_VERSION = 3

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result

      // v1-v2 stores — always ensure they exist
      if (!db.objectStoreNames.contains('custom-shapes')) {
        db.createObjectStore('custom-shapes', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('leaderboard')) {
        const store = db.createObjectStore('leaderboard', { keyPath: 'id' })
        store.createIndex('by-score', 'score', { unique: false })
      }

      // v3 stores
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

export async function recordAnswer(
  event: AnswerEvent,
  masteryUpdate: Partial<ShapeMastery>,
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const t = db.transaction(['shape-mastery', 'answer-events'], 'readwrite')
    const masteryStore = t.objectStore('shape-mastery')
    const eventsStore = t.objectStore('answer-events')

    const getReq = masteryStore.get(event.combinationId)
    getReq.onsuccess = () => {
      const existing = getReq.result as ShapeMastery | undefined
      const now = Date.now()
      const alpha = 0.3
      const isValidTime = event.responseTimeMs <= 10000

      const prevAvg = existing?.averageResponseTime ?? event.responseTimeMs
      const newAvg = isValidTime
        ? alpha * event.responseTimeMs + (1 - alpha) * prevAvg
        : prevAvg

      const prevBest = existing?.bestResponseTime ?? 0
      const newBest =
        event.correct && isValidTime
          ? prevBest === 0
            ? event.responseTimeMs
            : Math.min(prevBest, event.responseTimeMs)
          : prevBest

      const prevRecent = existing?.recentResponseTimes ?? []
      const newRecent = isValidTime
        ? [...prevRecent, event.responseTimeMs].slice(-10)
        : prevRecent

      const prevStreak = existing?.streakOnCombo ?? 0
      const newStreak = event.correct ? prevStreak + 1 : 0

      const newMastery: ShapeMastery = {
        combinationId: event.combinationId,
        totalAttempts: (existing?.totalAttempts ?? 0) + 1,
        correctAttempts: (existing?.correctAttempts ?? 0) + (event.correct ? 1 : 0),
        recentResponseTimes: newRecent,
        averageResponseTime: newAvg,
        bestResponseTime: newBest,
        lastSeenAt: now,
        firstSeenAt: existing?.firstSeenAt ?? now,
        streakOnCombo: newStreak,
        ...masteryUpdate,
      }

      masteryStore.put(newMastery)
      eventsStore.put(event)
    }
    getReq.onerror = () => reject(getReq.error)

    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error)
  })
}

export async function getShapeMastery(
  combinationId: string,
): Promise<ShapeMastery | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const store = db
      .transaction('shape-mastery', 'readonly')
      .objectStore('shape-mastery')
    const req = store.get(combinationId)
    req.onsuccess = () => resolve(req.result as ShapeMastery | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function getAllShapeMastery(): Promise<ShapeMastery[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const store = db
      .transaction('shape-mastery', 'readonly')
      .objectStore('shape-mastery')
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result as ShapeMastery[])
    req.onerror = () => reject(req.error)
  })
}

export async function getAnswerEvents(
  combinationId?: string,
  limit?: number,
): Promise<AnswerEvent[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const store = db
      .transaction('answer-events', 'readonly')
      .objectStore('answer-events')

    if (combinationId !== undefined) {
      const index = store.index('by-combination')
      const req = limit !== undefined
        ? index.getAll(combinationId, limit)
        : index.getAll(combinationId)
      req.onsuccess = () => resolve(req.result as AnswerEvent[])
      req.onerror = () => reject(req.error)
    } else {
      const req = limit !== undefined ? store.getAll(null, limit) : store.getAll()
      req.onsuccess = () => resolve(req.result as AnswerEvent[])
      req.onerror = () => reject(req.error)
    }
  })
}

export async function getRecentAnswerEvents(limit: number): Promise<AnswerEvent[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const store = db
      .transaction('answer-events', 'readonly')
      .objectStore('answer-events')
    const index = store.index('by-recorded-at')
    const req = index.openCursor(null, 'prev')
    const results: AnswerEvent[] = []

    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor && results.length < limit) {
        results.push(cursor.value as AnswerEvent)
        cursor.continue()
      } else {
        resolve(results)
      }
    }
    req.onerror = () => {
      log.game.error('getRecentAnswerEvents cursor error', req.error)
      reject(req.error)
    }
  })
}

