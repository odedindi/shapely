import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals'
import { log } from './logger'

type VitalResult = { name: string; value: number; rating: 'good' | 'needs-improvement' | 'poor' }

function handleVital({ name, value, rating }: VitalResult) {
  const formatted = name === 'CLS' ? value.toFixed(4) : `${Math.round(value)}ms`
  log.perf.info(`${name} ${formatted}`, { rating })
}

export function reportWebVitals() {
  if (import.meta.env.DEV) {
    onCLS(handleVital as never)
    onINP(handleVital as never)
    onLCP(handleVital as never)
    onFCP(handleVital as never)
    onTTFB(handleVital as never)
  }
}

export function markGameStart() {
  performance.mark('shapely:game-start')
  log.perf.info('game-start')
}

export function markBoardReady() {
  performance.mark('shapely:board-ready')
  const starts = performance.getEntriesByName('shapely:game-start')
  if (starts.length) {
    performance.measure('shapely:game-start → board-ready', 'shapely:game-start', 'shapely:board-ready')
    const [entry] = performance.getEntriesByName('shapely:game-start → board-ready')
    if (entry) {
      log.perf.info(`board-ready in ${Math.round(entry.duration)}ms`)
    }
  }
}
