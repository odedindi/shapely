import { log } from '@/lib/logger'
import { openDB, storeTx } from './index'

export interface ShapeMastery {
  combinationId: string
  totalAttempts: number
  correctAttempts: number
  recentResponseTimes: number[]
  averageResponseTime: number
  bestResponseTime: number
  lastSeenAt: number
  firstSeenAt: number
  streakOnCombo: number
}

export interface AnswerEvent {
  id: string
  combinationId: string
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
    totalSolvedAtTime: number
  }
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

export async function getShapeMastery(combinationId: string): Promise<ShapeMastery | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = storeTx(db, 'shape-mastery', 'readonly').get(combinationId)
    req.onsuccess = () => resolve(req.result as ShapeMastery | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function getAllShapeMastery(): Promise<ShapeMastery[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = storeTx(db, 'shape-mastery', 'readonly').getAll()
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
    const store = storeTx(db, 'answer-events', 'readonly')
    if (combinationId !== undefined) {
      const index = store.index('by-combination')
      const req = limit !== undefined ? index.getAll(combinationId, limit) : index.getAll(combinationId)
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
    const index = storeTx(db, 'answer-events', 'readonly').index('by-recorded-at')
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
