const DB_NAME = 'shapely'
export const DB_VERSION = 5

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains('custom-shapes')) {
        db.createObjectStore('custom-shapes', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('leaderboard')) {
        const store = db.createObjectStore('leaderboard', { keyPath: 'id' })
        store.createIndex('by-score', 'score', { unique: false })
        store.createIndex('by-profile', 'profileId', { unique: false })
      }
      if (!db.objectStoreNames.contains('shape-mastery')) {
        const masteryStore = db.createObjectStore('shape-mastery', { keyPath: 'combinationId' })
        masteryStore.createIndex('by-lastSeen', 'lastSeenAt', { unique: false })
      }
      if (!db.objectStoreNames.contains('answer-events')) {
        const eventsStore = db.createObjectStore('answer-events', { keyPath: 'id' })
        eventsStore.createIndex('by-combination', 'combinationId', { unique: false })
        eventsStore.createIndex('by-recorded-at', 'recordedAt', { unique: false })
      }
      if (!db.objectStoreNames.contains('profiles')) {
        db.createObjectStore('profiles', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('replays')) {
        const replaysStore = db.createObjectStore('replays', { keyPath: 'id' })
        replaysStore.createIndex('by-profile', 'profileId', { unique: false })
        replaysStore.createIndex('by-recorded-at', 'recordedAt', { unique: false })
      }
      if (!db.objectStoreNames.contains('player-progress')) {
        db.createObjectStore('player-progress', { keyPath: 'profileId' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function storeTx(db: IDBDatabase, storeName: string, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(storeName, mode).objectStore(storeName)
}
