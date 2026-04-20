import { m } from 'framer-motion'

interface SparklesProps {
  x: number
  y: number
  color?: string
}

const SPARKLE_COUNT = 8

export function Sparkles({ x, y, color = 'var(--color-primary)' }: SparklesProps) {
  return (
    <div style={{ position: 'fixed', left: x, top: y, pointerEvents: 'none', zIndex: 9999 }}>
      {Array.from({ length: SPARKLE_COUNT }).map((_, i) => {
        const angle = (i / SPARKLE_COUNT) * 360
        const rad = (angle * Math.PI) / 180
        const distance = 40
        return (
          <m.div
            key={i}
            style={{
              position: 'absolute',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: color,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(rad) * distance,
              y: Math.sin(rad) * distance,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}
