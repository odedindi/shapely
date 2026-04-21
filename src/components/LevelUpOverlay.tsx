import { useTranslation } from 'react-i18next'
import { m } from 'framer-motion'

export default function LevelUpOverlay() {
  const { t } = useTranslation()

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center"
      style={{ pointerEvents: 'none' }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, color-mix(in srgb, var(--color-primary) 20%, transparent), transparent)',
        }}
      />
      <m.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: [0.6, 1.05, 1], opacity: [0, 1, 1] }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.45, times: [0, 0.7, 1], ease: 'easeOut' }}
        className="relative flex flex-col items-center gap-3 px-10 py-8 rounded-3xl text-center"
        style={{
          background: 'color-mix(in srgb, var(--color-surface-raised) 92%, transparent)',
          boxShadow: '0 8px 40px color-mix(in srgb, var(--color-primary) 25%, transparent), 0 2px 8px rgba(0,0,0,0.15)',
          border: '1.5px solid color-mix(in srgb, var(--color-primary) 40%, var(--color-border))',
        }}
      >
        <span className="text-5xl select-none">✨</span>
        <p className="text-2xl font-bold text-[var(--color-content)]">
          {t('game.levelUp')}
        </p>
        <p className="text-sm font-medium text-[var(--color-content-muted)]">
          {t('game.levelUpSubtitle')}
        </p>
      </m.div>
    </div>
  )
}
