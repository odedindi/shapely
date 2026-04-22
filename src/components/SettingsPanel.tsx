import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { m, AnimatePresence } from 'framer-motion'
import { usePlatformStore } from '@/store/platformStore'
import { useGameSettingsStore } from '@/store/gameSettingsStore'
import { useProfiles } from '@/hooks/useProfiles'
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

const EMOJIS = ['🎮', '🦊', '🐼', '🐸', '🦋', '🌟', '🔥', '🎯', '🎲', '🧩', '🏆', '🚀', '🌈', '🐉', '🦄', '💎', '🌊', '🍀', '⚡', '🎸']

interface SettingsPanelProps {
  availableShapeCount?: number
  allShapes?: ShapeDefinition[]
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-content-muted)] border-b border-[var(--color-border)] pb-1 mb-1">
      {label}
    </p>
  )
}

export default function SettingsPanel({ availableShapeCount = Infinity, allShapes = [] }: SettingsPanelProps) {
  const { t } = useTranslation()
  const platform = usePlatformStore()
  const game = useGameSettingsStore()
  const { profiles, activeProfile, createProfile, switchProfile } = useProfiles()

  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('🎮')

  const shapeParams: ShapeRenderParams = {
    fillColor: 'var(--color-primary)',
    strokeColor: 'var(--color-content)',
    strokeWidth: 1,
    rotation: 0,
    opacity: 1,
  }

  const activeIds = game.activeShapeIds
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
      game.updateSetting('activeShapeIds', 'all')
    } else {
      game.updateSetting('activeShapeIds', next)
    }
  }

  function selectAll() {
    game.updateSetting('activeShapeIds', 'all')
  }

  function clearAll() {
    game.updateSetting('activeShapeIds', [])
  }

  async function handleCreateProfile() {
    const name = newName.trim()
    if (!name) return
    await createProfile(name, newEmoji)
    setNewName('')
    setNewEmoji('🎮')
    setShowAddModal(false)
  }

  return (
    <div className="p-6 flex flex-col gap-6 min-w-[280px]">
      <h2 className="text-xl font-bold text-[var(--color-content)]">
        {t('settings.title', { defaultValue: 'Settings' })}
      </h2>

      <section className="flex flex-col gap-3">
        <SectionHeader label={t('settings.profiles', { defaultValue: 'Profiles' })} />
        <div className="flex flex-wrap gap-2">
          {profiles.map((p) => {
            const isActive = p.id === activeProfile?.id
            return (
              <button
                key={p.id}
                onClick={() => switchProfile(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                  isActive
                    ? 'border-[var(--color-primary)] bg-[var(--color-surface-raised)] text-[var(--color-content)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-content)] opacity-70'
                }`}
              >
                <span>{p.emoji}</span>
                <span className="max-w-[6rem] truncate">{p.name}</span>
              </button>
            )
          })}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border-2 border-dashed border-[var(--color-border)] text-[var(--color-content-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            <span className="text-base leading-none">+</span>
            <span>{t('settings.addProfile', { defaultValue: 'Add' })}</span>
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader label={t('settings.sectionApp', { defaultValue: 'App' })} />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--color-content-muted)]">
            {t('settings.theme', { defaultValue: 'Theme' })}
          </label>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((th) => (
              <button
                key={th.value}
                aria-label={t(`settings.theme.${th.value}`, { defaultValue: th.value })}
                aria-pressed={platform.theme === th.value}
                onClick={() => platform.updatePlatformSetting('theme', th.value)}
                className={`w-9 h-9 rounded-full border-2 transition-transform ${platform.theme === th.value ? 'scale-110 border-[var(--color-content)]' : 'border-transparent'}`}
                style={{ backgroundColor: th.color }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--color-content-muted)]">
            {t('settings.mode', { defaultValue: 'Mode' })}
          </label>
          <div className="flex gap-2">
            {(['auto', 'light', 'dark'] as DarkMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => platform.updatePlatformSetting('darkMode', mode)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${platform.darkMode === mode ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]' : 'bg-[var(--color-surface-raised)] text-[var(--color-content)] border-[var(--color-border)]'}`}
              >
                {t(`settings.dark.${mode}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--color-content-muted)]">
            {t('settings.language', { defaultValue: 'Language' })}
          </label>
          <select
            value={platform.language}
            onChange={(e) => platform.updatePlatformSetting('language', e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-content)]"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader label={t('settings.sectionGame', { defaultValue: 'Game' })} />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--color-content-muted)]">
            {t('settings.gameMode', { defaultValue: 'Game Mode' })}
          </label>
          <div className="flex gap-2">
            {(['unique', 'weighted'] as GameMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => game.updateSetting('gameMode', mode)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${game.gameMode === mode ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]' : 'bg-[var(--color-surface-raised)] text-[var(--color-content)] border-[var(--color-border)]'}`}
              >
                {t(`settings.${mode}`, { defaultValue: mode.charAt(0).toUpperCase() + mode.slice(1) })}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--color-content-muted)]">
            {t('settings.gridSize', { defaultValue: 'Grid Size' })}
          </label>
          <div className="flex gap-2 flex-wrap">
            {([2, 3, 4, 5, 6, 7] as const).map((size) => {
              const disabled = size * 2 > availableShapeCount
              return (
                <button
                  key={size}
                  onClick={() => !disabled && game.updateSetting('gridSize', size)}
                  disabled={disabled}
                  title={disabled ? t('settings.gridSizeUnavailable', { defaultValue: 'Not enough shapes for this grid size' }) : undefined}
                  className={`w-10 h-10 rounded-lg font-bold border transition-colors ${
                    game.gridSize === size
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
        </div>

        {allShapes.length > 0 && (
          <div className="flex flex-col gap-2">
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
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--color-content-muted)]">
            {t('settings.combinationStyle', { defaultValue: 'Shape Style' })}
          </label>
          <div className="flex flex-wrap gap-2">
            {(['overlay', 'silhouette', 'nested', 'side-by-side', 'fill'] as CombinationStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => game.updateSetting('combinationStyle', style)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${game.combinationStyle === style ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]' : 'bg-[var(--color-surface-raised)] text-[var(--color-content)] border-[var(--color-border)]'}`}
              >
                {t(`settings.mode.${style}`, { defaultValue: style })}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--color-content-muted)]">
            {t('settings.revealMode', { defaultValue: 'Cell Reveal' })}
          </label>
          <div className="flex gap-2">
            {(['visible', 'peek', 'hidden'] as CellRevealMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => game.updateSetting('cellRevealMode', mode)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${game.cellRevealMode === mode ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]' : 'bg-[var(--color-surface-raised)] text-[var(--color-content)] border-[var(--color-border)]'}`}
              >
                {t(`settings.reveal.${mode}`, { defaultValue: mode })}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--color-content-muted)]">
            {t('settings.interactionMode', { defaultValue: 'Interaction' })}
          </label>
          <div className="flex gap-2">
            {(['drag', 'tap', 'both'] as InteractionMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => game.updateSetting('interactionMode', mode)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${game.interactionMode === mode ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]' : 'bg-[var(--color-surface-raised)] text-[var(--color-content)] border-[var(--color-border)]'}`}
              >
                {t(`settings.interaction_${mode}`, { defaultValue: mode.charAt(0).toUpperCase() + mode.slice(1) })}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={game.timerEnabled}
              onChange={(e) => game.updateSetting('timerEnabled', e.target.checked)}
              className="w-4 h-4 accent-[var(--color-primary)]"
            />
            <span className="text-sm text-[var(--color-content)]">
              {t('settings.timer', { defaultValue: 'Enable Timer' })}
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={game.adaptiveDifficulty}
              onChange={(e) => game.updateSetting('adaptiveDifficulty', e.target.checked)}
              className="w-4 h-4 accent-[var(--color-primary)]"
            />
            <span className="text-sm text-[var(--color-content)]">
              {t('settings.adaptive', { defaultValue: 'Adaptive Difficulty' })}
            </span>
          </label>
        </div>
      </section>

      <AnimatePresence>
        {showAddModal && (
          <m.div
            key="add-profile-modal"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
          >
            <m.div
              className="bg-[var(--color-surface)] rounded-2xl p-6 w-80 shadow-2xl flex flex-col gap-4"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-[var(--color-content)]">
                {t('settings.addProfile', { defaultValue: 'Add Profile' })}
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--color-content-muted)]">
                  {t('settings.profileName', { defaultValue: 'Name' })}
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateProfile() }}
                  placeholder={t('settings.profileName', { defaultValue: 'Name' })}
                  maxLength={20}
                  className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-content)] outline-none focus:border-[var(--color-primary)]"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--color-content-muted)]">
                  {t('settings.profileEmoji', { defaultValue: 'Avatar' })}
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setNewEmoji(emoji)}
                      className={`text-xl h-9 rounded-lg border-2 transition-all ${newEmoji === emoji ? 'border-[var(--color-primary)] bg-[var(--color-surface-raised)] scale-110' : 'border-transparent bg-[var(--color-surface-raised)]'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-sm border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-content)]"
                >
                  {t('settings.cancelProfile', { defaultValue: 'Cancel' })}
                </button>
                <button
                  onClick={handleCreateProfile}
                  disabled={!newName.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-[var(--color-primary-fg)] disabled:opacity-40"
                >
                  {t('settings.createProfile', { defaultValue: 'Create' })}
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
