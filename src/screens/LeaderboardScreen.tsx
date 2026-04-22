import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { m } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { getLeaderboardEntries, clearLeaderboard, type LeaderboardEntry } from '@/db/leaderboard'

const GRID_SIZES = [2, 3, 4, 5, 6, 7] as const

export default function LeaderboardScreen() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [gridFilter, setGridFilter] = useState<number | null>(null)
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  useEffect(() => {
    let active = true
    getLeaderboardEntries(gridFilter !== null ? { gridSize: gridFilter } : undefined, 100).then((results) => {
      if (active) setEntries(results)
    })
    return () => { active = false }
  }, [gridFilter])

  const handleClear = async () => {
    await clearLeaderboard()
    setEntries([])
    setShowConfirmClear(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
      <header className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Button>
        <h1 className="text-xl font-bold">{t('leaderboard.title', { defaultValue: 'Leaderboard' })}</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setGridFilter(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${gridFilter === null ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]' : 'bg-[var(--color-surface-raised)] text-[var(--color-content)] border-[var(--color-border)]'}`}
          >
            {t('leaderboard.allSizes', { defaultValue: 'All' })}
          </button>
          {GRID_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setGridFilter(size)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${gridFilter === size ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]' : 'bg-[var(--color-surface-raised)] text-[var(--color-content)] border-[var(--color-border)]'}`}
            >
              {size}×{size}
            </button>
          ))}
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-content-muted)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50">
              <circle cx="12" cy="8" r="7" />
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
            <p>{t('leaderboard.empty', { defaultValue: 'No scores yet. Play a game!' })}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry, index) => {
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null

              return (
                <m.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
                  className="flex items-center p-4 bg-[var(--color-surface-raised)] rounded-xl shadow-sm border border-[var(--color-border)]"
                >
                  <div className="w-10 text-center text-2xl font-bold shrink-0">
                    {medal || <span className="text-lg text-[var(--color-content-muted)]">{index + 1}</span>}
                  </div>

                  <div className="w-10 h-10 shrink-0 flex items-center justify-center text-2xl rounded-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] ms-2">
                    {entry.emoji || '🎮'}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center px-3">
                    <div className="font-bold text-[var(--color-content)] truncate">{entry.name}</div>
                    <div className="text-xs text-[var(--color-content-muted)] flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      <span>{formatTime(entry.timeElapsed)}</span>
                      <span>{Math.round(entry.accuracy)}%</span>
                      <span className="text-[var(--color-warning)]">🔥{entry.streak}</span>
                      <span className="opacity-60">{entry.gridSize}×{entry.gridSize}</span>
                    </div>
                  </div>

                  <div className="text-end shrink-0">
                    <div className="text-2xl font-black text-[var(--color-primary)] leading-none">
                      {entry.score}
                    </div>
                    <div className="text-xs text-[var(--color-content-muted)] mt-1">
                      {new Date(entry.recordedAt).toLocaleDateString()}
                    </div>
                  </div>
                </m.div>
              )
            })}
          </div>
        )}

        {entries.length > 0 && (
          <div className="mt-8 pt-8 border-t border-[var(--color-border)] flex flex-col items-center">
            {showConfirmClear ? (
              <m.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 bg-[var(--color-surface-raised)] p-4 rounded-xl shadow-md w-full"
              >
                <p className="text-[var(--color-error)] font-semibold text-center">
                  {t('leaderboard.confirmClear', { defaultValue: 'Are you sure? This cannot be undone.' })}
                </p>
                <div className="flex gap-4 w-full">
                  <Button variant="outline" className="flex-1" onClick={() => setShowConfirmClear(false)}>
                    {t('leaderboard.cancel', { defaultValue: 'Cancel' })}
                  </Button>
                  <Button variant="destructive" className="flex-1 bg-[var(--color-error)] text-white hover:opacity-90" onClick={handleClear}>
                    {t('leaderboard.confirm', { defaultValue: 'Confirm' })}
                  </Button>
                </div>
              </m.div>
            ) : (
              <Button variant="ghost" className="text-[var(--color-error)]" onClick={() => setShowConfirmClear(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                  <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
                </svg>
                {t('leaderboard.clearBoard', { defaultValue: 'Clear Board' })}
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
