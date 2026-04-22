import { openDB, storeTx } from './index'

export interface UserProfile {
  id: string
  name: string
  emoji: string
  createdAt: number
}

const STORE_NAME = 'profiles'

export async function saveProfile(profile: UserProfile): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = storeTx(db, STORE_NAME, 'readwrite').put(profile)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function getAllProfiles(): Promise<UserProfile[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = storeTx(db, STORE_NAME, 'readonly').getAll()
    req.onsuccess = () => resolve(req.result as UserProfile[])
    req.onerror = () => reject(req.error)
  })
}

export async function getProfile(id: string): Promise<UserProfile | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = storeTx(db, STORE_NAME, 'readonly').get(id)
    req.onsuccess = () => resolve(req.result as UserProfile | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteProfile(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = storeTx(db, STORE_NAME, 'readwrite').delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}
