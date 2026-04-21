import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { m } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { getLeaderboardEntries, clearLeaderboard, type LeaderboardEntry } from '@/db/leaderboard'

export default function LeaderboardScreen() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [gridSize, setGridSize] = useState<number>(3)
  const [gameMode] = useState<string>('unique')
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  useEffect(() => {
    let active = true
    getLeaderboardEntries({ gridSize, gameMode }).then((results) => {
      if (active) setEntries(results)
    })
    return () => { active = false }
  }, [gridSize, gameMode])

  const handleClear = async () => {
    await clearLeaderboard()
    setEntries([])
    setShowConfirmClear(false)
  }

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const mins = Math.floor(s / 60)
    const secs = s % 60
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
      <header className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Button>
        <h1 className="text-xl font-bold">{t('leaderboard.title', { defaultValue: 'Leaderboard' })}</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col gap-2 bg-[var(--color-surface-raised)] p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-sm font-semibold text-[var(--color-content-muted)] shrink-0">
              {t('settings.gridSize', { defaultValue: 'Grid Size' })}:
            </span>
            {[2, 3, 4, 5, 6, 7].map((size) => (
              <Button
                key={size}
                variant={gridSize === size ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGridSize(size)}
                className="shrink-0"
              >
                {size}×{size}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--color-content-muted)] shrink-0">
              {t('settings.mode', { defaultValue: 'Mode' })}:
            </span>
            <Button variant="default" size="sm">
              Unique
            </Button>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-content-muted)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-4 opacity-50"
            >
              <circle cx="12" cy="8" r="7" />
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
            <p>{t('leaderboard.empty', { defaultValue: 'No scores yet. Play a game!' })}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry, index) => {
              let medal = null
              if (index === 0) medal = '🥇'
              else if (index === 1) medal = '🥈'
              else if (index === 2) medal = '🥉'

              return (
                <m.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center p-4 bg-[var(--color-surface-raised)] rounded-xl shadow-sm border border-[var(--color-border)]"
                >
                  <div className="w-12 text-center text-2xl font-bold shrink-0">
                    {medal || <span className="text-lg text-[var(--color-content-muted)]">{index + 1}</span>}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center px-2">
                    <div className="font-bold text-lg text-[var(--color-content)] truncate">
                      {entry.name}
                    </div>
                    <div className="text-sm text-[var(--color-content-muted)] flex flex-wrap gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {formatTime(entry.timeElapsed)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                        {Math.round(entry.accuracy)}%
                      </span>
                      <span className="flex items-center gap-1 text-[var(--color-warning)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                        {entry.streak}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col justify-center">
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
                  <Button variant="destructive" className="flex-1 bg-[var(--color-error)] text-white hover:bg-[var(--color-error)] hover:opacity-90" onClick={handleClear}>
                    {t('leaderboard.confirm', { defaultValue: 'Confirm' })}
                  </Button>
                </div>
              </m.div>
            ) : (
              <Button variant="ghost" className="text-[var(--color-error)] hover:bg-[var(--color-error)] hover:bg-opacity-10" onClick={() => setShowConfirmClear(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                {t('leaderboard.clearBoard', { defaultValue: 'Clear Board' })}
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
