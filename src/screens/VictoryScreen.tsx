import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { m } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Button } from '@/components/ui/button'
import type { LeaderboardEntry } from '@/db/leaderboard'

interface VictoryScreenProps {
  score: number
  timeElapsed: number
  streak: number
  accuracy: number
  isNewRecord?: boolean
  previousBest?: number
  gridSize?: number
  gameMode?: string
  onPlayAgain: () => void
  onHome: () => void
  onSaveRecord?: (name: string) => void
  topEntries?: LeaderboardEntry[]
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function useCountUp(target: number, duration: number): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    startTimeRef.current = null
    setValue(0)

    const step = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return value
}

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', staggerChildren: 0.08 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
}

const trophyVariants: Variants = {
  hidden: { scale: 0.4, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 18, delay: 0.1 },
  },
}

export default function VictoryScreen({
  score,
  timeElapsed,
  streak,
  accuracy,
  isNewRecord = false,
  previousBest = 0,
  onPlayAgain,
  onHome,
  onSaveRecord,
  topEntries = [],
}: VictoryScreenProps) {
  const { t } = useTranslation()
  const animatedScore = useCountUp(score, 1200)
  const canShare = 'share' in navigator
  const [playerName, setPlayerName] = useState('')
  const [saved, setSaved] = useState(false)

  function handleShare() {
    const text = `${t('victory.score')}: ${score} | ${t('victory.accuracy')}: ${Math.round(accuracy)}% | ${t('victory.bestStreak')}: ${streak} 🔥`
    navigator.share({ title: 'Shapely', text }).catch(() => undefined)
  }

  function handleSave() {
    if (playerName.trim() && onSaveRecord && !saved) {
      onSaveRecord(playerName.trim())
      setSaved(true)
    }
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[var(--color-surface)] overflow-y-auto relative">
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 50% at 50% 40%, color-mix(in srgb, var(--color-primary) 12%, transparent), transparent)',
          pointerEvents: 'none',
        }}
      />

      <m.div
        className="relative z-10 flex flex-col items-center gap-6 px-6 w-full max-w-sm py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {isNewRecord && (
          <m.div
            variants={itemVariants}
            className="text-center px-4 py-2 rounded-full font-bold text-sm"
            style={{ background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)' }}
          >
            🎉 {t('victory.newRecord', { defaultValue: 'New Personal Best!' })}
          </m.div>
        )}

        <m.div variants={trophyVariants} className="text-7xl select-none">
          🏆
        </m.div>

        <m.div variants={itemVariants} className="text-center">
          <h1 className="text-3xl font-bold text-[var(--color-content)]">
            {t('victory.title')}
          </h1>
        </m.div>

        <m.div
          variants={itemVariants}
          className="flex flex-col items-center gap-1 px-8 py-4 rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] w-full"
          style={{ boxShadow: '0 4px 24px color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
        >
          <span className="text-sm font-medium text-[var(--color-content-muted)] uppercase tracking-widest">
            {t('victory.score')}
          </span>
          <span className="text-5xl font-bold tabular-nums" style={{ color: 'var(--color-primary)' }}>
            {animatedScore}
          </span>
          {!isNewRecord && previousBest > 0 && (
            <span className="text-xs text-[var(--color-content-muted)] mt-1 font-medium">
              {t('victory.personalBest', { defaultValue: 'Personal Best' })}: {previousBest}
            </span>
          )}
        </m.div>

        {isNewRecord && onSaveRecord && (
          <m.div variants={itemVariants} className="w-full">
            {saved ? (
              <div className="w-full py-3 text-center text-[var(--color-success)] font-bold bg-[var(--color-surface-raised)] border border-[var(--color-success)] rounded-xl">
                {t('leaderboard.saved', { defaultValue: '✓ Saved!' })}
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <input
                  type="text"
                  maxLength={20}
                  autoFocus
                  placeholder={t('leaderboard.namePlaceholder', { defaultValue: 'Your name' })}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-content)] placeholder:text-[var(--color-content-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <Button 
                  onClick={handleSave} 
                  disabled={!playerName.trim()}
                  className="h-auto py-3 px-6 rounded-xl font-bold"
                >
                  {t('leaderboard.saveRecord', { defaultValue: 'Save' })}
                </Button>
              </div>
            )}
          </m.div>
        )}

        <m.div variants={itemVariants} className="grid grid-cols-3 gap-3 w-full">
          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-content-muted)] font-medium">
              {t('victory.time')}
            </span>
            <span className="text-lg font-bold text-[var(--color-content)] tabular-nums">
              {formatTime(timeElapsed)}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-content-muted)] font-medium">
              {t('victory.accuracy')}
            </span>
            <span className="text-lg font-bold text-[var(--color-content)] tabular-nums">
              {Math.round(accuracy)}%
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-content-muted)] font-medium">
              {t('victory.bestStreak')}
            </span>
            <span className="text-lg font-bold text-[var(--color-content)] tabular-nums">
              {streak} 🔥
            </span>
          </div>
        </m.div>

        {!isNewRecord && topEntries.length > 0 && (
          <m.div variants={itemVariants} className="w-full mt-2 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-4">
            <h3 className="text-sm font-bold text-[var(--color-content-muted)] mb-3 uppercase tracking-wider text-center">
              {t('leaderboard.topScores', { defaultValue: 'Top Scores' })}
            </h3>
            <div className="flex flex-col gap-2">
              {topEntries.map((entry, index) => (
                <div key={entry.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[var(--color-content-muted)] w-4 text-center font-medium">{index + 1}</span>
                    <span className="font-bold text-[var(--color-content)] truncate">{entry.name}</span>
                  </div>
                  <span className="font-bold text-[var(--color-primary)] tabular-nums shrink-0">{entry.score}</span>
                </div>
              ))}
            </div>
          </m.div>
        )}

        <m.div variants={itemVariants} className="flex flex-col gap-3 w-full mt-2">
          {canShare && (
            <button
              onClick={handleShare}
              className="w-full py-3 px-4 rounded-xl border border-[var(--color-primary)] text-[var(--color-primary)] font-semibold text-sm transition-colors hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-fg)] flex items-center justify-center gap-2"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              {t('victory.share')}
            </button>
          )}
          <button
            onClick={onPlayAgain}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-colors text-[var(--color-primary-fg)]"
            style={{ background: 'var(--color-primary)' }}
          >
            {t('victory.playAgain')}
          </button>
          <button
            onClick={onHome}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-colors border border-[var(--color-border)] text-[var(--color-content)] hover:bg-[var(--color-surface-alt)]"
          >
            {t('victory.home')}
          </button>
        </m.div>
      </m.div>
    </div>
  )
}
