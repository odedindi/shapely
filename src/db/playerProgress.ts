import { openDB, storeTx } from './index'

export interface PlayerProgressRecord {
  profileId: string
  totalXP: number
  unlockedTitleLevels: number[]
  updatedAt: number
}

const STORE_NAME = 'player-progress'

export async function savePlayerProgress(record: PlayerProgressRecord): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = storeTx(db, STORE_NAME, 'readwrite').put(record)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function getPlayerProgress(profileId: string): Promise<PlayerProgressRecord | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = storeTx(db, STORE_NAME, 'readonly').get(profileId)
    req.onsuccess = () => resolve(req.result as PlayerProgressRecord | undefined)
    req.onerror = () => reject(req.error)
  })
}
