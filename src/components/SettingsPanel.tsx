import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/store/settingsStore'
import type { Theme, DarkMode, CombinationStyle, CellRevealMode } from '@/shapes/types'

const THEMES: { value: Theme; label: string; color: string }[] = [
  { value: 'default', label: 'Default', color: '#6366f1' },
  { value: 'sunset', label: 'Sunset', color: '#f97316' },
  { value: 'forest', label: 'Forest', color: '#22c55e' },
  { value: 'ocean', label: 'Ocean', color: '#0ea5e9' },
  { value: 'candy', label: 'Candy', color: '#ec4899' },
  { value: 'monochrome', label: 'Mono', color: '#6b7280' },
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

export default function SettingsPanel() {
  const { t } = useTranslation()
  const settings = useSettingsStore()

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
              aria-label={th.label}
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
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
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
          {t('settings.gridSize', { defaultValue: 'Grid Size' })}
        </label>
        <div className="flex gap-2">
          {([2, 3, 4, 5] as const).map((size) => (
            <button
              key={size}
              onClick={() => settings.updateSetting('gridSize', size)}
              className={`w-10 h-10 rounded-lg font-bold border transition-colors ${settings.gridSize === size ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]' : 'bg-[var(--color-surface-raised)] text-[var(--color-content)] border-[var(--color-border)]'}`}
            >
              {size}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[var(--color-content-muted)]">
          {t('settings.combinationStyle', { defaultValue: 'Shape Style' })}
        </label>
        <div className="flex flex-wrap gap-2">
          {(['overlay', 'silhouette', 'nested', 'side-by-side'] as CombinationStyle[]).map((style) => (
            <button
              key={style}
              onClick={() => settings.updateSetting('combinationStyle', style)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${settings.combinationStyle === style ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]' : 'bg-[var(--color-surface-raised)] text-[var(--color-content)] border-[var(--color-border)]'}`}
            >
              {style}
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
              {mode}
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
