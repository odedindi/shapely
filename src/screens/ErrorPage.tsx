import { m } from 'framer-motion'
import { BUILTIN_SHAPES } from '@/shapes/registry'

const BROKEN_SHAPES = BUILTIN_SHAPES.slice(0, 5)

function getShapeColor(index: number): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--shape-color-${Math.min(Math.max(index, 1), 8)}`)
    .trim()
}

interface ErrorPageProps {
  error: Error
  onReset?: () => void
}

export default function ErrorPage({ error, onReset }: ErrorPageProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[var(--color-surface)] px-4">
      {BROKEN_SHAPES.map((shape, i) => {
        const size = 40 + (i % 3) * 20
        const xPos = 5 + (i * 19) % 88
        const yPos = 5 + (i * 17) % 78
        return (
          <m.div
            key={shape.id}
            className="absolute pointer-events-none"
            style={{ left: `${xPos}%`, top: `${yPos}%`, opacity: 0.12 }}
            animate={{
              y: [0, -14, 0],
              rotate: [0, i % 2 === 0 ? 20 : -20, 0],
              scale: [1, 0.88, 1],
            }}
            transition={{
              duration: 4 + i * 0.7,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
          >
            {shape.render({
              size,
              fillColor: getShapeColor(i + 3),
              strokeColor: 'transparent',
              strokeWidth: 0,
              rotation: 0,
              opacity: 1,
            })}
          </m.div>
        )
      })}

      <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-sm">
        <m.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-24 h-24 rounded-3xl bg-[var(--color-error)] flex items-center justify-center shadow-2xl"
          style={{ boxShadow: '0 0 48px color-mix(in srgb, var(--color-error) 40%, transparent)' }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M24 8L4 40h40L24 8z"
              stroke="white"
              strokeWidth="3"
              strokeLinejoin="round"
              fill="none"
            />
            <line x1="24" y1="20" x2="24" y2="30" stroke="white" strokeWidth="3" strokeLinecap="round" />
            <circle cx="24" cy="35" r="1.8" fill="white" />
          </svg>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="flex flex-col gap-2"
        >
          <h1 className="text-3xl font-extrabold text-[var(--color-content)] tracking-tight">
            Something broke
          </h1>
          <p className="text-[var(--color-content-muted)] text-base leading-relaxed">
            A shape fell out of place. The error has been noted.
          </p>
        </m.div>

        {import.meta.env.DEV && (
          <m.details
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="w-full text-start rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] overflow-hidden"
          >
            <summary className="px-4 py-3 text-sm font-semibold text-[var(--color-content-muted)] cursor-pointer select-none">
              Error details
            </summary>
            <pre className="px-4 pb-4 text-xs text-[var(--color-error)] whitespace-pre-wrap break-all font-mono leading-relaxed">
              {error.message}
              {error.stack ? `\n\n${error.stack}` : ''}
            </pre>
          </m.details>
        )}

        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex gap-3"
        >
          {onReset && (
            <button
              onClick={onReset}
              className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-semibold text-sm hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Try again
            </button>
          )}
          <button
            onClick={() => { window.location.href = '/' }}
            className="px-5 py-2.5 rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-content)] font-semibold text-sm border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            Go home
          </button>
        </m.div>
      </div>
    </div>
  )
}
