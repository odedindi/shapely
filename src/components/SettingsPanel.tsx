import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/store/settingsStore'
import type { Theme, DarkMode, CombinationStyle, CellRevealMode, GameMode, InteractionMode, ShapeDefinition, ShapeRenderParams } from '@/shapes/types'

const THEMES: { value: Theme; color: string }[] = [
  { value: 'default', color: '#6366f1' },
  { value: 'sunset', color: '#f97316' },
  { value: 'forest', color: '#22c55e' },
  { value: 'ocean', color: '#0ea5e9' },
  { value: 'candy', color: '#ec4899' },
  { value: 'monochrome', color: '#6b7280' },
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'he', label: 'עברית' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'ar', label: 'العربية' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'pt', label: 'Português' },
  { value: 'ru', label: 'Русский' },
]

interface SettingsPanelProps {
  availableShapeCount?: number
  allShapes?: ShapeDefinition[]
}

export default function SettingsPanel({ availableShapeCount = Infinity, allShapes = [] }: SettingsPanelProps) {
  const { t } = useTranslation()
  const settings = useSettingsStore()

  const shapeParams: ShapeRenderParams = {
    fillColor: 'var(--color-primary)',
    strokeColor: 'var(--color-content)',
    strokeWidth: 1,
    rotation: 0,
    opacity: 1,
  }

  const activeIds = settings.activeShapeIds
  const isAllActive = activeIds === 'all'

  function isShapeActive(id: string) {
    return isAllActive || (activeIds as string[]).includes(id)
  }

  function toggleShape(id: string) {
    const currentActive = isAllActive ? allShapes.map((s) => s.id) : [...(activeIds as string[])]
    const next = currentActive.includes(id)
      ? currentActive.filter((x) => x !== id)
      : [...currentActive, id]
    if (next.length === allShapes.length) {
      settings.updateSetting('activeShapeIds', 'all')
    } else {
      settings.updateSetting('activeShapeIds', next)
    }
  }

  function selectAll() {
    settings.updateSetting('activeShapeIds', 'all')
  }

  function clearAll() {
    settings.updateSetting('activeShapeIds', [])
  }

  return (
    <div className="p-6 flex flex-col gap-6 min-w-[280px]">
      <h2 className="text-xl font-bold text-[var(--color-content)]">
        {t('settings.title', { defaultValue: 'Settings' })}
      </h2>

      <section className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[var(--color-content-muted)]">
          {t('settings.theme', { defaultValue: 'Theme' })}
        </label>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((th) => (
            <button
              key={th.value}
              aria-label={t(`settings.theme.${th.value}`, { defaultValue: th.value })}
              aria-pressed={settings.theme === th.value}
              onClick={() => settings.updateSetting('theme', th.value)}
              className={`w-9 h-9 rounded-full border-2 transition-transform ${settings.theme === th.value ? 'scale-110 border-[var(--color-content)]' : 'border-transparent'}`}
              style={{ backgroundColor: th.color }}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[var(--color-content-muted)]">
          {t('settings.mode', { defaultValue: 'Mode' })}
        </label>
        <div className="flex gap-2">
          {(['auto', 'light', 'dark'] as DarkMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => settings.updateSetting('darkMode', mode)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${settings.darkMode === mode ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]' : 'bg-[var(--color-surface-raised)] text-[var(--color-content)] border-[var(--color-border)]'}`}
            >
              {t(`settings.dark.${mode}`)}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[var(--color-content-muted)]">
          {t('settings.language', { defaultValue: 'Language' })}
        </label>
        <select
          value={settings.language}
          onChange={(e) => settings.updateSetting('language', e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-content)]"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>{lang.label}</option>
          ))}
        </select>
      </section>

      <section className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[var(--color-content-muted)]">
          {t('settings.gameMode', { defaultValue: 'Game Mode' })}
        </label>
        <div className="flex gap-2">
          {(['unique', 'weighted'] as GameMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => settings.updateSetting('gameMode', mode)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${settings.gameMode === mode ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]' : 'bg-[var(--color-surface-raised)] text-[var(--color-content)] border-[var(--color-border)]'}`}
            >
              {t(`settings.${mode}`, { defaultValue: mode.charAt(0).toUpperCase() + mode.slice(1) })}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[var(--color-content-muted)]">
          {t('settings.gridSize', { defaultValue: 'Grid Size' })}
        </label>
        <div className="flex gap-2 flex-wrap">
          {([2, 3, 4, 5, 6, 7] as const).map((size) => {
            const disabled = size * 2 > availableShapeCount
            return (
              <button
                key={size}
                onClick={() => !disabled && settings.updateSetting('gridSize', size)}
                disabled={disabled}
                title={disabled ? t('settings.gridSizeUnavailable', { defaultValue: 'Not enough shapes for this grid size' }) : undefined}
                className={`w-10 h-10 rounded-lg font-bold border transition-colors ${
                  settings.gridSize === size
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]'
                    : disabled
                      ? 'opacity-30 cursor-not-allowed bg-[var(--color-surface-raised)] text-[var(--color-content-muted)] border-[var(--color-border)]'
                      : 'bg-[var(--color-surface-raised)] text-[var(--color-content)] border-[var(--color-border)]'
                }`}
              >
                {size}
              </button>
            )
          })}
        </div>
      </section>

      {allShapes.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[var(--color-content-muted)]">
              {t('settings.shapes')}
            </label>
            <div className="flex gap-1">
              <button
                onClick={selectAll}
                className="px-2 py-0.5 rounded text-xs border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-content)]"
              >
                {t('settings.shapesSelectAll')}
              </button>
              <button
                onClick={clearAll}
                className="px-2 py-0.5 rounded text-xs border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-content)]"
              >
                {t('settings.shapesClear')}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto">
            {allShapes.map((shape) => {
              const active = isShapeActive(shape.id)
              return (
                <button
                  key={shape.id}
                  title={shape.name}
                  aria-pressed={active}
                  onClick={() => toggleShape(shape.id)}
                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                    active
                      ? 'border-[var(--color-primary)] bg-[var(--color-surface-raised)]'
                      : 'border-transparent bg-[var(--color-surface-raised)] opacity-30'
                  }`}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox={shape.viewBox}
                    aria-hidden="true"
                    style={{ overflow: 'visible' }}
                    dangerouslySetInnerHTML={{ __html: shape.svgBody(shapeParams) }}
                  />
                </button>
              )
            })}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[var(--color-content-muted)]">
          {t('settings.combinationStyle', { defaultValue: 'Shape Style' })}
        </label>
        <div className="flex flex-wrap gap-2">
          {(['overlay', 'silhouette', 'nested', 'side-by-side', 'fill'] as CombinationStyle[]).map((style) => (
            <button
              key={style}
              onClick={() => settings.updateSetting('combinationStyle', style)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${settings.combinationStyle === style ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]' : 'bg-[var(--color-surface-raised)] text-[var(--color-content)] border-[var(--color-border)]'}`}
            >
              {t(`settings.mode.${style}`, { defaultValue: style })}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[var(--color-content-muted)]">
          {t('settings.revealMode', { defaultValue: 'Cell Reveal' })}
        </label>
        <div className="flex gap-2">
          {(['visible', 'peek', 'hidden'] as CellRevealMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => settings.updateSetting('cellRevealMode', mode)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${settings.cellRevealMode === mode ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]' : 'bg-[var(--color-surface-raised)] text-[var(--color-content)] border-[var(--color-border)]'}`}
            >
              {t(`settings.reveal.${mode}`, { defaultValue: mode })}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[var(--color-content-muted)]">
          {t('settings.interactionMode', { defaultValue: 'Interaction' })}
        </label>
        <div className="flex gap-2">
          {(['drag', 'tap', 'both'] as InteractionMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => settings.updateSetting('interactionMode', mode)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${settings.interactionMode === mode ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]' : 'bg-[var(--color-surface-raised)] text-[var(--color-content)] border-[var(--color-border)]'}`}
            >
              {t(`settings.interaction_${mode}`, { defaultValue: mode.charAt(0).toUpperCase() + mode.slice(1) })}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.timerEnabled}
            onChange={(e) => settings.updateSetting('timerEnabled', e.target.checked)}
            className="w-4 h-4 accent-[var(--color-primary)]"
          />
          <span className="text-sm text-[var(--color-content)]">
            {t('settings.timer', { defaultValue: 'Enable Timer' })}
          </span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.adaptiveDifficulty}
            onChange={(e) => settings.updateSetting('adaptiveDifficulty', e.target.checked)}
            className="w-4 h-4 accent-[var(--color-primary)]"
          />
          <span className="text-sm text-[var(--color-content)]">
            {t('settings.adaptive', { defaultValue: 'Adaptive Difficulty' })}
          </span>
        </label>
      </section>
    </div>
  )
}
