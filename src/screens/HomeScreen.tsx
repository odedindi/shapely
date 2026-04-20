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
        </m.div>
      </div>
    </div>
  )
}
