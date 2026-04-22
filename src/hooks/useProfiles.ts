import { useState, useEffect, useCallback } from 'react'
import { getAllProfiles, saveProfile, deleteProfile, type UserProfile } from '@/db/profiles'
import { usePlatformStore } from '@/store/platformStore'
import { log } from '@/lib/logger'

export function useProfiles() {
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const { activeProfileId, updatePlatformSetting } = usePlatformStore()

  useEffect(() => {
    let mounted = true
    getAllProfiles()
      .then((all) => {
        if (!mounted) return
        setProfiles(all)
        setLoading(false)
        if (all.length > 0 && !activeProfileId) {
          updatePlatformSetting('activeProfileId', all[0].id)
        }
      })
      .catch((err) => {
        log.ui.error('failed to load profiles', err)
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [activeProfileId, updatePlatformSetting])

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0] ?? null

  const createProfile = useCallback(async (name: string, emoji: string): Promise<UserProfile> => {
    const profile: UserProfile = {
      id: crypto.randomUUID(),
      name: name.trim(),
      emoji,
      createdAt: Date.now(),
    }
    await saveProfile(profile)
    setProfiles((prev) => [...prev, profile])
    updatePlatformSetting('activeProfileId', profile.id)
    log.ui.info('profile created', { id: profile.id, name: profile.name })
    return profile
  }, [updatePlatformSetting])

  const switchProfile = useCallback((id: string) => {
    updatePlatformSetting('activeProfileId', id)
    log.ui.info('profile switched', { id })
  }, [updatePlatformSetting])

  const removeProfile = useCallback(async (id: string) => {
    await deleteProfile(id)
    setProfiles((prev) => {
      const next = prev.filter((p) => p.id !== id)
      if (activeProfileId === id && next.length > 0) {
        updatePlatformSetting('activeProfileId', next[0].id)
      }
      return next
    })
    log.ui.info('profile deleted', { id })
  }, [activeProfileId, updatePlatformSetting])

  return { profiles, loading, activeProfile, createProfile, switchProfile, removeProfile }
}
