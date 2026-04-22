import { openDB, storeTx } from './index'
import type { BoardState, CardState, GameMode } from '@/shapes/types'

export type ReplayEvent =
  | { type: 'startGame'; board: BoardState; gameMode: GameMode; ts: number }
  | { type: 'submitAnswer'; col: number; row: number; ts: number }
  | { type: 'nextCard'; card: CardState; ts: number }
  | { type: 'resetGame'; ts: number }

export interface ReplayRecord {
  id: string
  profileId: string
  events: ReplayEvent[]
  gridSize: number
  score: number
  correctAnswers: number
  totalAnswers: number
  timeElapsed: number
  recordedAt: number
}

const STORE_NAME = 'replays'

export async function saveReplay(replay: ReplayRecord): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = storeTx(db, STORE_NAME, 'readwrite').put(replay)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function getReplay(id: string): Promise<ReplayRecord | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = storeTx(db, STORE_NAME, 'readonly').get(id)
    req.onsuccess = () => resolve(req.result as ReplayRecord | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function getReplaysForProfile(profileId: string, limit = 20): Promise<ReplayRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const index = storeTx(db, STORE_NAME, 'readonly').index('by-recorded-at')
    const req = index.openCursor(null, 'prev')
    const results: ReplayRecord[] = []
    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor && results.length < limit) {
        const record = cursor.value as ReplayRecord
        if (record.profileId === profileId) results.push(record)
        cursor.continue()
      } else {
        resolve(results)
      }
    }
    req.onerror = () => reject(req.error)
  })
}

export async function deleteReplay(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = storeTx(db, STORE_NAME, 'readwrite').delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}
