import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { m, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { log } from '@/lib/logger'
import { useShapeRegistry } from '@/hooks/useShapeRegistry'
import { getAllShapeMastery, type ShapeMastery } from '@/db/shapeMastery'

import { getReplaysForProfile, type ReplayRecord } from '@/db/replays'
import { getProfileLeaderboardStats } from '@/db/leaderboard'
import { useProfiles } from '@/hooks/useProfiles'
import { usePlatformStore } from '@/store/platformStore'

import { ShapeRenderParams, ShapeDefinition } from '@/shapes/types'
import { cn } from '@/lib/utils'

export default function ProgressScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { allShapes } = useShapeRegistry()
  const [masteryData, setMasteryData] = useState<ShapeMastery[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCombo, setSelectedCombo] = useState<ShapeMastery | null>(null)

  const { activeProfileId } = usePlatformStore()
  const { profiles, activeProfile } = useProfiles()
  const [replays, setReplays] = useState<ReplayRecord[]>([])
  const [selectedCompareProfileId, setSelectedCompareProfileId] = useState<string>('')
  
  const [activeStats, setActiveStats] = useState<{
    totalGames: number
    bestScore: number
    bestStreak: number
    avgAccuracy: number
  } | null>(null)
  
  const [compareStats, setCompareStats] = useState<{
    totalGames: number
    bestScore: number
    bestStreak: number
    avgAccuracy: number
  } | null>(null)

  useEffect(() => {
    let isMounted = true
    if (!activeProfileId) return

    // Load Replays
    getReplaysForProfile(activeProfileId, 20).then(data => {
      if (isMounted) setReplays(data)
    }).catch(console.error)

    // Load Active Profile Stats
    getProfileLeaderboardStats(activeProfileId).then(data => {
      if (isMounted) setActiveStats(data)
    }).catch(console.error)

    return () => { isMounted = false }
  }, [activeProfileId])

  useEffect(() => {
    let isMounted = true
    if (!selectedCompareProfileId) {
      setCompareStats(null)
      return
    }
    
    getProfileLeaderboardStats(selectedCompareProfileId).then(data => {
      if (isMounted) setCompareStats(data)
    }).catch(console.error)

    return () => { isMounted = false }
  }, [selectedCompareProfileId])


  useEffect(() => {
    let isMounted = true
    getAllShapeMastery().then(data => {
      if (isMounted) {
        setMasteryData(data)
        setLoading(false)
      }
    }).catch(() => {
      if (isMounted) setLoading(false)
    })
    return () => { isMounted = false }
  }, [])

  const shapeMap = useMemo(() => {
    const map = new Map<string, ShapeDefinition>()
    allShapes.forEach(s => map.set(s.id, s))
    return map
  }, [allShapes])

  // Get only shapes that have appeared in any mastery combination
  const activeShapeIds = useMemo(() => {
    const ids = new Set<string>()
    masteryData.forEach(d => {
      const [colId, rowId] = d.combinationId.split('::')
      ids.add(colId)
      ids.add(rowId)
    })
    // Sort them so the order is consistent with allShapes order
    return allShapes.filter(s => ids.has(s.id)).map(s => s.id)
  }, [masteryData, allShapes])

  const stats = useMemo(() => {
    let totalAttempts = 0
    let totalCorrect = 0
    let sumResponseTime = 0
    let combosSeen = masteryData.length

    masteryData.forEach(d => {
      totalAttempts += d.totalAttempts
      totalCorrect += d.correctAttempts
      sumResponseTime += d.averageResponseTime
    })

    const overallAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0
    const avgResponseTime = combosSeen > 0 ? sumResponseTime / combosSeen : 0

    return { combosSeen, overallAccuracy, avgResponseTime }
  }, [masteryData])

  const getMasteryScore = (data: ShapeMastery) => {
    if (data.totalAttempts === 0) return 0
    const accuracy = data.correctAttempts / data.totalAttempts
    const speedFactor = 1 - Math.min(Math.max(data.averageResponseTime / 5000, 0), 1)
    return accuracy * speedFactor
  }

  const renderShapeIcon = (shapeId: string, idx: number) => {
    const shape = shapeMap.get(shapeId)
    if (!shape) return null
    const params: ShapeRenderParams = {
      fillColor: `var(--shape-color-${(idx % 8) + 1})`,
      strokeColor: 'var(--color-border)',
      strokeWidth: 2,
      rotation: 0,
      opacity: 0.5,
    }
    return shape.render(params)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center h-16 px-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { log.ui.info('navigate', { to: '/' }); navigate(-1) }}
          className="me-2 text-[var(--color-content-muted)] hover:text-[var(--color-content)]"
          aria-label={t('common.back', { defaultValue: 'Back' })}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </Button>
        <h1 className="text-xl font-bold flex-1 text-center me-10">
          {t('progress.title', { defaultValue: 'Progress' })}
        </h1>
      </header>

      {/* Summary Row */}
      <div className="flex p-4 gap-4 bg-[var(--color-surface-alt)] border-b border-[var(--color-border)]">
        <div className="flex-1 flex flex-col items-center p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
          <span className="text-[10px] uppercase font-bold text-[var(--color-content-muted)] tracking-wider">{t('progress.combosSeen', { defaultValue: 'Combos Seen' })}</span>
          <span className="text-2xl font-black text-[var(--color-primary)]">{stats.combosSeen}</span>
        </div>
        <div className="flex-1 flex flex-col items-center p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
          <span className="text-[10px] uppercase font-bold text-[var(--color-content-muted)] tracking-wider">{t('progress.avgTime', { defaultValue: 'Avg Time' })}</span>
          <span className="text-2xl font-black text-[var(--color-primary)]">{(stats.avgResponseTime / 1000).toFixed(1)}s</span>
        </div>
        <div className="flex-1 flex flex-col items-center p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
          <span className="text-[10px] uppercase font-bold text-[var(--color-content-muted)] tracking-wider">{t('progress.accuracy', { defaultValue: 'Accuracy' })}</span>
          <span className="text-2xl font-black text-[var(--color-primary)]">{stats.overallAccuracy.toFixed(0)}%</span>
        </div>
      </div>

      {/* Heatmap Area */}
      <main className="flex-1 overflow-auto p-4 relative">
        {loading ? (
          <div className="h-full flex items-center justify-center text-[var(--color-content-muted)]">{t('progress.loading', { defaultValue: 'Loading...' })}</div>
        ) : (
          <div className="flex flex-col gap-10 pb-20">
            {/* Heatmap Section */}
            {activeShapeIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-[var(--color-content-muted)] gap-4 py-10">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-20">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
                <p>{t('progress.noData', { defaultValue: 'Play some games to see your mastery heatmap!' })}</p>
              </div>
            ) : (
              <div className="mx-auto w-fit overflow-x-auto pb-2">
                <div 
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `auto repeat(${activeShapeIds.length}, 40px)`
                  }}
                >
                  {/* Top Header Row */}
                  <div className="w-10 h-10"></div>
                  {activeShapeIds.map((colId, i) => (
                    <div key={`col-${colId}`} className="w-10 h-10 flex items-center justify-center p-2">
                      {renderShapeIcon(colId, i)}
                    </div>
                  ))}

                  {/* Rows */}
                  {activeShapeIds.map((rowId, rowIdx) => {
                    let rowCorrect = 0
                    let rowAttempts = 0

                    return (
                      <div key={`row-wrap-${rowId}`} className="contents">
                        {/* Left Header */}
                        <div className="w-10 h-10 flex items-center justify-center p-2">
                          {renderShapeIcon(rowId, rowIdx)}
                        </div>
                        
                        {/* Cells */}
                        {activeShapeIds.map((colId) => {
                          const comboId = `${colId}::${rowId}`
                          const data = masteryData.find(d => d.combinationId === comboId)
                          
                          if (data) {
                            rowCorrect += data.correctAttempts
                            rowAttempts += data.totalAttempts
                          }

                          const score = data ? getMasteryScore(data) : 0
                          const hasData = !!data

                          return (
                            <div 
                              key={comboId} 
                              className={cn(
                                "w-10 h-10 rounded-md cursor-pointer transition-transform hover:scale-105 active:scale-95",
                                !hasData ? "border border-[var(--color-border)] bg-[var(--color-surface-alt)]" : ""
                              )}
                              style={hasData ? {
                                backgroundColor: 'var(--color-success)',
                                opacity: 0.1 + (score * 0.9)
                              } : {}}
                              onClick={() => data && setSelectedCombo(data)}
                            />
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Compare Profiles Section */}
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-bold">{t('progress.compareProfiles', { defaultValue: 'Compare Profiles' })}</h2>
              {profiles.length <= 1 ? (
                <div className="text-[var(--color-content-muted)] bg-[var(--color-surface-alt)] p-4 rounded-xl text-center border border-[var(--color-border)]">
                  {t('progress.addAnotherProfile', { defaultValue: 'Add another profile to compare' })}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2 items-center">
                    <select
                      className="flex-1 bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-content)] rounded-lg p-2"
                      value={selectedCompareProfileId}
                      onChange={(e) => setSelectedCompareProfileId(e.target.value)}
                    >
                      <option value="">{t('progress.selectProfile', { defaultValue: 'Select profile...' })}</option>
                      {profiles.filter(p => p.id !== activeProfileId).map(p => (
                        <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {activeStats && compareStats && (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Active Profile */}
                      <div className="flex flex-col gap-2 p-3 bg-[var(--color-surface-alt)] rounded-xl border border-[var(--color-border)]">
                        <div className="font-bold text-center border-b border-[var(--color-border)] pb-2 mb-1 truncate">
                          {activeProfile?.emoji} {activeProfile?.name}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--color-content-muted)]">{t('progress.stats.totalGames', { defaultValue: 'Total Games' })}</span>
                          <span className="font-bold">{activeStats.totalGames}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--color-content-muted)]">{t('progress.stats.bestScore', { defaultValue: 'Best Score' })}</span>
                          <span className="font-bold">{activeStats.bestScore}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--color-content-muted)]">{t('progress.stats.bestStreak', { defaultValue: 'Best Streak' })}</span>
                          <span className="font-bold">{activeStats.bestStreak}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--color-content-muted)]">{t('progress.stats.avgAccuracy', { defaultValue: 'Avg Accuracy' })}</span>
                          <span className="font-bold">{Math.round(activeStats.avgAccuracy * 100)}%</span>
                        </div>
                      </div>
                      
                      {/* Compare Profile */}
                      <div className="flex flex-col gap-2 p-3 bg-[var(--color-surface-alt)] rounded-xl border border-[var(--color-border)]">
                        <div className="font-bold text-center border-b border-[var(--color-border)] pb-2 mb-1 truncate">
                          {profiles.find(p => p.id === selectedCompareProfileId)?.emoji} {profiles.find(p => p.id === selectedCompareProfileId)?.name}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--color-content-muted)]">{t('progress.stats.totalGames', { defaultValue: 'Total Games' })}</span>
                          <span className="font-bold">{compareStats.totalGames}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--color-content-muted)]">{t('progress.stats.bestScore', { defaultValue: 'Best Score' })}</span>
                          <span className="font-bold">{compareStats.bestScore}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--color-content-muted)]">{t('progress.stats.bestStreak', { defaultValue: 'Best Streak' })}</span>
                          <span className="font-bold">{compareStats.bestStreak}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--color-content-muted)]">{t('progress.stats.avgAccuracy', { defaultValue: 'Avg Accuracy' })}</span>
                          <span className="font-bold">{Math.round(compareStats.avgAccuracy * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>


            {/* Recent Replays Section */}
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-bold">{t('progress.recentReplays', { defaultValue: 'Recent Replays' })}</h2>
              {replays.length === 0 ? (
                <div className="text-[var(--color-content-muted)] bg-[var(--color-surface-alt)] p-4 rounded-xl text-center border border-[var(--color-border)]">
                  {t('progress.noReplays', { defaultValue: 'No replays yet. Play a game to record one!' })}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {replays.map((replay) => (
                    <div key={replay.id} className="flex items-center justify-between p-3 bg-[var(--color-surface-alt)] rounded-xl border border-[var(--color-border)]">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">
                          {new Date(replay.recordedAt).toLocaleDateString()} {new Date(replay.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-xs text-[var(--color-content-muted)] flex gap-2">
                          <span>{t('progress.gridSize', { defaultValue: 'Grid Size' })}: {replay.gridSize}x{replay.gridSize}</span>
                          <span>&bull;</span>
                          <span>{t('progress.score', { defaultValue: 'Score' })}: {replay.score}</span>
                          <span>&bull;</span>
                          <span>{Math.round((replay.correctAnswers / replay.totalAnswers) * 100)}% {t('progress.accuracy', { defaultValue: 'Accuracy' })}</span>
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/replay/${replay.id}`)}
                      >
                        {t('progress.playReplay', { defaultValue: 'Play' })}
                        <svg className="ms-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        )}
</main>

      {/* Popover for selected combo */}
      <AnimatePresence>
        {selectedCombo && (
          <m.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 inset-inline-4 bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-2xl p-4 rounded-2xl z-50 flex flex-col gap-3"
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-2">
                <div className="w-8 h-8 p-1 bg-[var(--color-surface-alt)] rounded">
                  {renderShapeIcon(selectedCombo.combinationId.split('::')[0], 0)}
                </div>
                <div className="w-8 h-8 p-1 bg-[var(--color-surface-alt)] rounded">
                  {renderShapeIcon(selectedCombo.combinationId.split('::')[1], 1)}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full -mt-2 -me-2" onClick={() => setSelectedCombo(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--color-content-muted)] uppercase tracking-wider font-bold">{t('progress.accuracy', { defaultValue: 'Accuracy' })}</span>
                <span className="text-xl font-bold">
                  {selectedCombo.totalAttempts > 0 
                    ? Math.round((selectedCombo.correctAttempts / selectedCombo.totalAttempts) * 100) 
                    : 0}%
                  <span className="text-xs text-[var(--color-content-muted)] ms-1 font-normal">
                    ({selectedCombo.correctAttempts}/{selectedCombo.totalAttempts})
                  </span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--color-content-muted)] uppercase tracking-wider font-bold">{t('progress.avgTime', { defaultValue: 'Avg Time' })}</span>
                <span className="text-xl font-bold">
                  {selectedCombo.averageResponseTime > 0 
                    ? (selectedCombo.averageResponseTime / 1000).toFixed(2) + 's'
                    : '-'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--color-content-muted)] uppercase tracking-wider font-bold">{t('progress.bestTime', { defaultValue: 'Best Time' })}</span>
                <span className="text-xl font-bold">
                  {selectedCombo.bestResponseTime < Infinity && selectedCombo.bestResponseTime > 0
                    ? (selectedCombo.bestResponseTime / 1000).toFixed(2) + 's'
                    : '-'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--color-content-muted)] uppercase tracking-wider font-bold">{t('progress.currentStreak', { defaultValue: 'Current Streak' })}</span>
                <span className="text-xl font-bold">
                  {selectedCombo.streakOnCombo} <span className="text-sm">🔥</span>
                </span>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
      {selectedCombo && (
        <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" onClick={() => setSelectedCombo(null)} />
      )}
    </div>
  )
}
