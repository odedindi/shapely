import { useEffect, useRef, useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'

interface ScorePopProps {
  score: number
  children: React.ReactNode
}

export function ScorePop({ score, children }: ScorePopProps) {
  const prevScoreRef = useRef(score)
  const [popKey, setPopKey] = useState(0)
  const [delta, setDelta] = useState(0)

  useEffect(() => {
    const diff = score - prevScoreRef.current
    if (diff > 0) {
      setDelta(diff)
      setPopKey((k) => k + 1)
    }
    prevScoreRef.current = score
  }, [score])

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {children}
      <AnimatePresence>
        {delta > 0 && (
          <m.span
            key={popKey}
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: -40, opacity: 0 }}
            exit={{}}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              insetInlineStart: '50%',
              top: 0,
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              color: 'var(--color-success)',
              fontWeight: 'bold',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
            }}
          >
            +{delta}
          </m.span>
        )}
      </AnimatePresence>
    </span>
  )
}
