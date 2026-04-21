import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useShapeRegistry } from '@/hooks/useShapeRegistry'
import ShapeEditor from '@/components/ShapeEditor'
import type { CustomShapeRecord } from '@/shapes/types'
import { log } from '@/lib/logger'

type Tab = 'library' | 'editor'

export default function ShapeEditorScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { customRecords, loading, addCustomShape, updateCustomShape, removeCustomShape } = useShapeRegistry()

  const [tab, setTab] = useState<Tab>('library')
  const [editing, setEditing] = useState<CustomShapeRecord | undefined>(undefined)

  function openNewEditor() {
    setEditing(undefined)
    setTab('editor')
  }

  function openEditRecord(record: CustomShapeRecord) {
    setEditing(record)
    setTab('editor')
  }

  async function handleSave(name: string, svgContent: string, viewBox: string) {
    if (editing) {
      await updateCustomShape(editing.id, { name, svgContent, viewBox })
    } else {
      await addCustomShape(name, svgContent, viewBox)
    }
    setTab('library')
  }

  function handleCancel() {
    setTab('library')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)]" dir="ltr">
      <header className="h-14 flex items-center gap-3 px-4 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
        <button
          aria-label={t('nav.back')}
          onClick={() => { log.ui.info('navigate', { to: '/', from: 'shape-editor' }); navigate('/') }}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface)] transition-colors text-[var(--color-content-muted)]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="font-bold text-lg text-[var(--color-content)]">
          {t('editor.title')}
        </h1>
      </header>

      <div className="flex border-b border-[var(--color-border)]">
        {(['library', 'editor'] as Tab[]).map((tabId) => (
          <button
            key={tabId}
            onClick={() => { if (tabId === 'library') setTab('library'); else openNewEditor() }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${tab === tabId ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-content-muted)]'}`}
          >
            {tabId === 'library'
              ? t('editor.library')
              : t('editor.newShape')}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {tab === 'library' ? (
          <div className="p-4 flex flex-col gap-4">
            <div className="flex justify-end">
              <button
                onClick={openNewEditor}
                className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                + {t('editor.addShape')}
              </button>
            </div>

            {loading ? (
              <p className="text-center text-[var(--color-content-muted)] py-12">
                {t('editor.loading')}
              </p>
            ) : customRecords.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center gap-3">
                <p className="text-[var(--color-content-muted)]">
                  {t('editor.empty')}
                </p>
                <button
                  onClick={openNewEditor}
                  className="text-[var(--color-primary)] underline text-sm"
                >
                  {t('editor.createFirst')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {customRecords.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3 flex flex-col gap-2"
                  >
                    <svg
                      viewBox={record.viewBox ?? '0 0 100 100'}
                      className="w-full aspect-square text-[var(--color-primary)] overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: record.svgContent }}
                    />
                    <p className="text-sm font-semibold text-[var(--color-content)] text-center truncate">
                      {record.name}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditRecord(record)}
                        className="flex-1 py-1 text-xs rounded-lg border border-[var(--color-border)] text-[var(--color-content)] hover:bg-[var(--color-surface-alt)] transition-colors"
                      >
                        {t('editor.edit')}
                      </button>
                      <button
                        onClick={() => { log.ui.info('shape deleted', { id: record.id, name: record.name }); removeCustomShape(record.id) }}
                        aria-label={t('editor.delete')}
                        className="py-1 px-2 text-xs rounded-lg border border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <ShapeEditor
            record={editing}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  )
}
