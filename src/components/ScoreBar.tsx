import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { m, useAnimation } from 'framer-motion'
import { ScorePop } from '@/components/magic/ScorePop'

interface ScoreBarProps {
  score: number
  streak: number
  timeElapsed: number
  timerEnabled: boolean
  onSettingsOpen: () => void
  onBack: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function ScoreBar({ score, streak, timeElapsed, timerEnabled, onSettingsOpen, onBack }: ScoreBarProps) {
  const { t } = useTranslation()
  const streakControls = useAnimation()
  const prevStreak = useRef(streak)

  useEffect(() => {
    if (streak > prevStreak.current && streak >= 2) {
      streakControls.start({
        scale: [1, 1.45, 0.9, 1.15, 1],
        rotate: [0, -10, 10, -5, 0],
        transition: { duration: 0.5, ease: 'easeOut' },
      })
    }
    prevStreak.current = streak
  }, [streak, streakControls])

  return (
    <div className="h-14 flex items-center px-4 gap-4 bg-[var(--color-surface-alt)] border-b border-[var(--color-border)] shrink-0">
      <button
        aria-label={t('nav.back')}
        onClick={onBack}
        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface)] transition-colors text-[var(--color-content-muted)]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <span className="font-semibold text-[var(--color-content)]">
        {t('game.score', { defaultValue: 'Score' })}:{' '}
        <ScorePop score={score}>
          <span>{score}</span>
        </ScorePop>
      </span>

      <div className="flex-1 flex justify-center">
        {streak >= 2 && (
          <m.span
            className="text-[var(--color-content)] font-bold flex items-center gap-1"
            animate={streakControls}
            initial={{ scale: 1 }}
          >
            <m.span
              className="inline-block"
              animate={streakControls}
            >
              🔥
            </m.span>
            {streak}
          </m.span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {timerEnabled && (
          <span className="font-mono text-[var(--color-content-muted)]">
            {formatTime(timeElapsed)}
          </span>
        )}
        <button
          aria-label={t('game.settings', { defaultValue: 'Settings' })}
          onClick={onSettingsOpen}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface)] transition-colors text-[var(--color-content-muted)] group"
        >
          <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="transition-transform duration-300 group-hover:rotate-90"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
