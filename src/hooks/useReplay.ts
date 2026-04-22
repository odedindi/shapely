import { useState, useEffect, useRef, useCallback } from 'react'
import { getReplay, type ReplayRecord, type ReplayEvent } from '@/db/replays'
import { useGameStore } from '@/store/gameStore'
import { log } from '@/lib/logger'

export type ReplaySpeed = 1 | 2 | 'instant'

export function useReplay(replayId: string) {
  const [replay, setReplay] = useState<ReplayRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<ReplaySpeed>(1)
  const [eventIndex, setEventIndex] = useState(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let mounted = true
    getReplay(replayId)
      .then((r) => {
        if (!mounted) return
        setReplay(r ?? null)
        setLoading(false)
      })
      .catch((err: unknown) => {
        log.ui.error('failed to load replay', err)
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [replayId])

  const store = useGameStore.getState

  const applyEvent = useCallback((event: ReplayEvent) => {
    const s = store()
    switch (event.type) {
      case 'startGame':
        s.startGame(event.board, event.gameMode)
        break
      case 'nextCard':
        s.nextCard(event.card)
        break
      case 'submitAnswer':
        s.submitAnswer(event.col, event.row)
        break
      case 'resetGame':
        s.resetGame()
        break
    }
  }, [store])

  const scheduleNext = useCallback((events: ReplayEvent[], index: number, currentSpeed: ReplaySpeed) => {
    if (index >= events.length) {
      setPlaying(false)
      return
    }
    const event = events[index]
    const next = events[index + 1]
    const delay = next && currentSpeed !== 'instant'
      ? Math.max(50, (next.ts - event.ts) / currentSpeed)
      : 0

    timeoutRef.current = setTimeout(() => {
      applyEvent(event)
      setEventIndex(index + 1)
      scheduleNext(events, index + 1, currentSpeed)
    }, delay)
  }, [applyEvent])

  const startPlayback = useCallback(() => {
    if (!replay) return
    store().resetGame()
    setEventIndex(0)
    setPlaying(true)

    if (speed === 'instant') {
      replay.events.forEach(applyEvent)
      setEventIndex(replay.events.length)
      setPlaying(false)
      return
    }

    scheduleNext(replay.events, 0, speed)
  }, [replay, speed, applyEvent, scheduleNext, store])

  const stopPlayback = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setPlaying(false)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const progress = replay ? eventIndex / Math.max(replay.events.length, 1) : 0

  return {
    replay,
    loading,
    playing,
    speed,
    setSpeed,
    progress,
    eventIndex,
    startPlayback,
    stopPlayback,
  }
}
