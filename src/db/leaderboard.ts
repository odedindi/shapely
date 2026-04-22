import { log } from '@/lib/logger'
import { openDB, storeTx } from './index'

export interface LeaderboardEntry {
  id: string
  profileId: string
  name: string
  emoji: string
  score: number
  timeElapsed: number
  accuracy: number
  streak: number
  gridSize: number
  gameMode: string
  recordedAt: number
}

const STORE_NAME = 'leaderboard'

export async function saveLeaderboardEntry(entry: LeaderboardEntry): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = storeTx(db, STORE_NAME, 'readwrite').put(entry)
    req.onsuccess = () => {
      log.game.info('leaderboard entry saved', { score: entry.score, gridSize: entry.gridSize })
      resolve()
    }
    req.onerror = () => reject(req.error)
  })
}

export async function getLeaderboardEntries(filter?: {
  gridSize?: number
  gameMode?: string
}, limit = 100): Promise<LeaderboardEntry[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const index = storeTx(db, STORE_NAME, 'readonly').index('by-score')
    const req = index.openCursor(null, 'prev')
    const results: LeaderboardEntry[] = []

    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor && results.length < limit) {
        const entry = cursor.value as LeaderboardEntry
        let match = true
        if (filter?.gridSize !== undefined && entry.gridSize !== filter.gridSize) match = false
        if (filter?.gameMode !== undefined && entry.gameMode !== filter.gameMode) match = false
        if (match) results.push(entry)
        cursor.continue()
      } else {
        resolve(results)
      }
    }
    req.onerror = () => reject(req.error)
  })
}

export async function getProfileLeaderboardStats(profileId: string): Promise<{
  totalGames: number
  bestScore: number
  bestStreak: number
  avgAccuracy: number
}> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const index = storeTx(db, STORE_NAME, 'readonly').index('by-profile')
    const req = index.getAll(profileId)
    req.onsuccess = () => {
      const entries = req.result as LeaderboardEntry[]
      if (entries.length === 0) {
        resolve({ totalGames: 0, bestScore: 0, bestStreak: 0, avgAccuracy: 0 })
        return
      }
      const bestScore = Math.max(...entries.map((e) => e.score))
      const bestStreak = Math.max(...entries.map((e) => e.streak))
      const avgAccuracy = entries.reduce((s, e) => s + e.accuracy, 0) / entries.length
      resolve({ totalGames: entries.length, bestScore, bestStreak, avgAccuracy })
    }
    req.onerror = () => reject(req.error)
  })
}

export async function clearLeaderboard(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = storeTx(db, STORE_NAME, 'readwrite').clear()
    req.onsuccess = () => {
      log.game.info('leaderboard cleared')
      resolve()
    }
    req.onerror = () => reject(req.error)
  })
}
