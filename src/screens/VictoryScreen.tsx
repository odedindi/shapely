import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { m } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Button } from '@/components/ui/button'
import type { LeaderboardEntry } from '@/db/leaderboard'
import type { BoardBonusBreakdown } from '@/store/gameStore'
import type { LevelDefinition } from '@/progression/levels'
import { xpProgressInLevel, xpRangeForLevel } from '@/progression/levels'

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
  boardBonusBreakdown?: BoardBonusBreakdown
  boardBonus?: number
  fastestAnswer?: number
  avgResponseMs?: number
  clutchRate?: number
  xpEarned?: number
  xpBefore?: number
  xpAfter?: number
  didLevelUp?: boolean
  levelBefore?: LevelDefinition | null
  levelAfter?: LevelDefinition | null
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatMs(ms: number): string {
  if (ms === 0) return '–'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
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

function useAnimatedWidth(targetPct: number, delay = 400): number {
  const [pct, setPct] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const duration = 900

  useEffect(() => {
    const timeout = setTimeout(() => {
      startRef.current = null
      const step = (ts: number) => {
        if (startRef.current === null) startRef.current = ts
        const elapsed = ts - startRef.current
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setPct(targetPct * eased)
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step)
        }
      }
      rafRef.current = requestAnimationFrame(step)
    }, delay)

    return () => {
      clearTimeout(timeout)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [targetPct, delay])

  return pct
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

interface BreakdownRowProps {
  label: string
  value: number | string
  highlight?: boolean
  multiplier?: boolean
}

function BreakdownRow({ label, value, highlight, multiplier }: BreakdownRowProps) {
  return (
    <div className="flex justify-between items-center text-sm py-1">
      <span className="text-[var(--color-content-muted)]">{label}</span>
      <span
        className="font-bold tabular-nums"
        style={{ color: highlight ? 'var(--color-success)' : multiplier ? 'var(--color-warning)' : 'var(--color-content)' }}
      >
        {value}
      </span>
    </div>
  )
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
  boardBonusBreakdown,
  fastestAnswer = 0,
  avgResponseMs = 0,
  clutchRate = 0,
  xpEarned = 0,
  xpBefore = 0,
  xpAfter = 0,
  didLevelUp = false,
  levelBefore = null,
  levelAfter = null,
}: VictoryScreenProps) {
  const { t } = useTranslation()
  const animatedScore = useCountUp(score, 1200)
  const canShare = 'share' in navigator
  const [playerName, setPlayerName] = useState('')
  const [saved, setSaved] = useState(false)
  const [showLevelUpReveal, setShowLevelUpReveal] = useState(false)

  // XP bar: animate from xpBefore position → xpAfter position within the levelBefore range
  const levelBeforeNum = levelBefore?.level ?? 1
  const xpRangeBefore = xpRangeForLevel(levelBeforeNum)
  const xpStartPct = xpRangeBefore > 0 ? Math.min((xpProgressInLevel(xpBefore) / xpRangeBefore) * 100, 100) : 0

  // After level up: bar fills to 100% then resets to new position in next level
  const xpEndLevelNum = (didLevelUp ? levelAfter?.level : levelBefore?.level) ?? levelBeforeNum
  const xpRangeEnd = xpRangeForLevel(xpEndLevelNum)
  const xpEndPct = xpRangeEnd > 0 ? Math.min((xpProgressInLevel(xpAfter) / xpRangeEnd) * 100, 100) : 100

  // Phase 1: fill to 100 (or end if no level up). Phase 2 (level up only): reset + fill to new position
  const [xpPhase, setXpPhase] = useState<1 | 2>(1)
  const phase1Target = didLevelUp ? 100 : xpEndPct
  const phase1Width = useAnimatedWidth(phase1Target, 600)

  useEffect(() => {
    if (!didLevelUp) return
    const t1 = setTimeout(() => {
      setShowLevelUpReveal(true)
      setXpPhase(2)
    }, 1800)
    return () => clearTimeout(t1)
  }, [didLevelUp])

  const phase2Width = useAnimatedWidth(xpPhase === 2 ? xpEndPct : 0, 200)
  const displayBarWidth = xpPhase === 2 ? phase2Width : phase1Width

  const baseScore = score - (boardBonusBreakdown
    ? Math.round(
        (boardBonusBreakdown.speedClear + boardBonusBreakdown.perfectBoard + boardBonusBreakdown.flawlessStreak) *
          boardBonusBreakdown.difficultyMultiplier
      )
    : 0)

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

  const hasBreakdownBonuses =
    boardBonusBreakdown &&
    (boardBonusBreakdown.speedClear > 0 ||
      boardBonusBreakdown.perfectBoard > 0 ||
      boardBonusBreakdown.flawlessStreak > 0 ||
      boardBonusBreakdown.difficultyMultiplier !== 1.0)

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
            🎉 {t('victory.newRecord')}
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
              {t('victory.personalBest')}: {previousBest}
            </span>
          )}
        </m.div>

        {isNewRecord && onSaveRecord && (
          <m.div variants={itemVariants} className="w-full">
            {saved ? (
              <div className="w-full py-3 text-center text-[var(--color-success)] font-bold bg-[var(--color-surface-raised)] border border-[var(--color-success)] rounded-xl">
                {t('leaderboard.saved')}
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <input
                  type="text"
                  maxLength={20}
                  autoFocus
                  placeholder={t('leaderboard.namePlaceholder')}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-content)] placeholder:text-[var(--color-content-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <Button
                  onClick={handleSave}
                  disabled={!playerName.trim()}
                  className="h-auto py-3 px-6 rounded-xl font-bold"
                >
                  {t('leaderboard.saveRecord')}
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

        {hasBreakdownBonuses && boardBonusBreakdown && (
          <m.div
            variants={itemVariants}
            className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-4"
          >
            <h3 className="text-sm font-bold text-[var(--color-content-muted)] mb-3 uppercase tracking-wider text-center">
              {t('victory.scoreBreakdown')}
            </h3>
            <div className="divide-y divide-[var(--color-border)]">
              <BreakdownRow label={t('victory.baseAnswers')} value={baseScore} />
              {boardBonusBreakdown.speedClear > 0 && (
                <BreakdownRow label={`⚡ ${t('victory.speedClear')}`} value={`+${boardBonusBreakdown.speedClear}`} highlight />
              )}
              {boardBonusBreakdown.perfectBoard > 0 && (
                <BreakdownRow label={`✨ ${t('victory.perfectBoard')}`} value={`+${boardBonusBreakdown.perfectBoard}`} highlight />
              )}
              {boardBonusBreakdown.flawlessStreak > 0 && (
                <BreakdownRow label={`🔥 ${t('victory.flawlessStreak')}`} value={`+${boardBonusBreakdown.flawlessStreak}`} highlight />
              )}
              {boardBonusBreakdown.difficultyMultiplier !== 1.0 && (
                <BreakdownRow
                  label={`👁️ ${t('victory.hiddenMode')}`}
                  value={`×${boardBonusBreakdown.difficultyMultiplier.toFixed(1)}`}
                  multiplier
                />
              )}
              <div className="pt-2 mt-1">
                <BreakdownRow label={t('victory.total')} value={score} />
              </div>
            </div>
          </m.div>
        )}

        {(fastestAnswer > 0 || avgResponseMs > 0 || clutchRate > 0) && (
          <m.div
            variants={itemVariants}
            className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-4"
          >
            <h3 className="text-sm font-bold text-[var(--color-content-muted)] mb-3 uppercase tracking-wider text-center">
              {t('victory.quickStats')}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-[var(--color-content-muted)] font-medium text-center">
                  {t('victory.fastestAnswer')}
                </span>
                <span className="text-base font-bold text-[var(--color-success)] tabular-nums">
                  {formatMs(fastestAnswer)}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-[var(--color-content-muted)] font-medium text-center">
                  {t('victory.avgResponse')}
                </span>
                <span className="text-base font-bold text-[var(--color-content)] tabular-nums">
                  {formatMs(avgResponseMs)}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-[var(--color-content-muted)] font-medium text-center">
                  {t('victory.clutchRate')}
                </span>
                <span className="text-base font-bold text-[var(--color-primary)] tabular-nums">
                  {Math.round(clutchRate * 100)}%
                </span>
              </div>
            </div>
          </m.div>
        )}

        {xpEarned > 0 && levelBefore && levelAfter && (
          <m.div
            variants={itemVariants}
            className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[var(--color-content-muted)] uppercase tracking-wider">
                {t('victory.levelProgress')}
              </h3>
              <span
                className="text-sm font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                  color: 'var(--color-primary)',
                }}
              >
                {t('victory.xpEarned', { xp: xpEarned })}
              </span>
            </div>

                {didLevelUp && showLevelUpReveal && levelAfter.level > levelBefore.level && (
              <m.div
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                className="mb-3 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold"
                style={{
                  background: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
                  color: 'var(--color-success)',
                }}
              >
                <span className="text-xl">{levelAfter.icon}</span>
                {t('victory.levelUp')} {levelAfter.name}
              </m.div>
            )}

                <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-medium text-[var(--color-content)]">
                {xpPhase === 1 ? levelBefore.icon : levelAfter?.icon ?? levelAfter.icon}{' '}
                {t('level.current', { level: xpPhase === 1 ? levelBefore.level : levelAfter.level })}
              </span>
              {(xpPhase === 1 ? xpRangeForLevel(levelBefore.level) : xpRangeForLevel(levelAfter.level)) > 0 && (
                <span className="text-xs text-[var(--color-content-muted)]">
                  {xpPhase === 1
                    ? `${Math.round(xpProgressInLevel(xpBefore))} / ${xpRangeForLevel(levelBefore.level)} XP`
                    : `${Math.round(xpProgressInLevel(xpAfter))} / ${xpRangeForLevel(levelAfter.level)} XP`}
                </span>
              )}
            </div>

                <div
              className="w-full h-3 rounded-full overflow-hidden"
              style={{ background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' }}
            >
              <div
                className="h-full rounded-full transition-none"
                style={{
                  width: `${Math.max(0, Math.min(displayBarWidth, 100))}%`,
                  background: 'var(--color-primary)',
                  transition: 'none',
                }}
              />
            </div>

                {xpPhase === 1 && xpStartPct > 0 && xpStartPct < 100 && (
              <div className="relative h-1 mt-0.5">
                <div
                  className="absolute top-0 w-0.5 h-3 rounded-full opacity-30"
                  style={{
                    insetInlineStart: `${xpStartPct}%`,
                    background: 'var(--color-content)',
                    transform: 'translateY(-50%)',
                  }}
                />
              </div>
            )}
          </m.div>
        )}

        {!isNewRecord && topEntries.length > 0 && (
          <m.div variants={itemVariants} className="w-full mt-2 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-4">
            <h3 className="text-sm font-bold text-[var(--color-content-muted)] mb-3 uppercase tracking-wider text-center">
              {t('leaderboard.topScores')}
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
