import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { m } from 'framer-motion'
import { BUILTIN_SHAPES } from '@/shapes/registry'
import { Button } from '@/components/ui/button'
import { log } from '@/lib/logger'

const FLOATING_SHAPES = BUILTIN_SHAPES.slice(0, 6)

function getShapeColor(index: number): string {
  const clamped = Math.min(Math.max(index, 1), 8)
  return getComputedStyle(document.documentElement).getPropertyValue(`--shape-color-${clamped}`).trim()
}

export default function HomeScreen() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[var(--color-surface)] px-4">
      {FLOATING_SHAPES.map((shape, i) => {
        const size = 48 + (i % 3) * 24
        const xPos = 5 + (i * 16) % 90
        const yPos = 5 + (i * 13) % 80
        const duration = 6 + (i % 4) * 2
        return (
          <m.div
            key={shape.id}
            className="absolute pointer-events-none opacity-20"
            style={{ left: `${xPos}%`, top: `${yPos}%` }}
            animate={{ y: [0, -20, 0], rotate: [0, 15, 0] }}
            transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
          >
            {shape.render({
              size,
              fillColor: getShapeColor(i + 1),
              strokeColor: 'transparent',
              strokeWidth: 0,
              rotation: 0,
              opacity: 1,
            })}
          </m.div>
        )
      })}

      <div className="relative z-10 flex flex-col items-center gap-8 text-center">
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl font-extrabold text-[var(--color-primary)] tracking-tight">
            Shapely
          </h1>
          <p className="mt-2 text-[var(--color-content-muted)] text-lg md:text-xl">
            {t('home.subtitle', { defaultValue: 'Train your visual perception' })}
          </p>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col gap-3 w-full max-w-xs"
        >
          <Button
              size="lg"
              onClick={() => { log.ui.info('navigate', { to: '/game' }); navigate('/game') }}
              className="w-full text-xl py-4 h-auto font-bold shadow-lg"
            >
              {t('home.play', { defaultValue: 'Play' })}
            </Button>
            <Button
              variant="outline"
              onClick={() => { log.ui.info('navigate', { to: '/settings' }); navigate('/settings') }}
              className="w-full font-semibold"
            >
              {t('home.settings', { defaultValue: 'Settings' })}
            </Button>
            <Button
              variant="outline"
              onClick={() => { log.ui.info('navigate', { to: '/shape-editor' }); navigate('/shape-editor') }}
              className="w-full font-semibold"
            >
              {t('home.shapeEditor', { defaultValue: 'Shape Editor' })}
            </Button>
            <div className="flex justify-center mt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { log.ui.info('navigate', { to: '/leaderboard' }); navigate('/leaderboard') }}
                className="w-12 h-12 rounded-full text-[var(--color-primary)] hover:bg-[var(--color-surface-raised)]"
                title={t('leaderboard.title', { defaultValue: 'Leaderboard' })}
              >
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
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
              </Button>
            </div>
        </m.div>
      </div>
    </div>
  )
}
