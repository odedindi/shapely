import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import SettingsPanel from '@/components/SettingsPanel'
import { useShapeRegistry } from '@/hooks/useShapeRegistry'
import { log } from '@/lib/logger'

export default function SettingsScreen() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { allShapes } = useShapeRegistry()

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
      <header className="h-14 flex items-center gap-3 px-4 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] shrink-0">
        <button
          aria-label={t('nav.back')}
          onClick={() => { log.ui.info('navigate', { to: '/', from: 'settings' }); navigate('/') }}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface)] transition-colors text-[var(--color-content-muted)]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="font-bold text-lg text-[var(--color-content)]">
          {t('settings.title')}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto">
          <SettingsPanel availableShapeCount={allShapes.length} allShapes={allShapes} />
        </div>
      </div>
    </div>
  )
}
