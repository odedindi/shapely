import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { EditorView, basicSetup } from 'codemirror'
import { xml } from '@codemirror/lang-xml'
import { oneDark } from '@codemirror/theme-one-dark'
import type { CustomShapeRecord } from '@/shapes/types'
import { log } from '@/lib/logger'

interface ShapeEditorProps {
  record?: CustomShapeRecord
  onSave: (name: string, svgContent: string) => Promise<void>
  onCancel: () => void
}

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="currentColor"/>
</svg>`

function sanitizeSvg(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
}

function SvgCodeEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const view = new EditorView({
      doc: value,
      extensions: [
        basicSetup,
        xml(),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString())
          }
        }),
        EditorView.theme({
          '&': { height: '100%', minHeight: '200px', fontSize: '13px' },
          '.cm-scroller': { overflow: 'auto', fontFamily: 'monospace' },
        }),
      ],
      parent: containerRef.current,
    })
    editorRef.current = view

    return () => {
      view.destroy()
      editorRef.current = null
    }
  }, [])

  useEffect(() => {
    const view = editorRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      })
    }
  }, [value])

  return (
    <div
      ref={containerRef}
      className="rounded-lg overflow-hidden border border-[var(--color-border)] min-h-[200px]"
      dir="ltr"
    />
  )
}

export default function ShapeEditor({ record, onSave, onCancel }: ShapeEditorProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(record?.name ?? '')
  const [svgCode, setSvgCode] = useState(record?.svgContent ?? PLACEHOLDER_SVG)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sanitized = sanitizeSvg(svgCode)

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result
      if (typeof text === 'string') setSvgCode(text)
    }
    reader.onerror = () => {
      log.ui.error('FileReader failed to read SVG file', { fileName: file.name, size: file.size })
    }
    reader.readAsText(file)
  }, [])

  const handleSave = useCallback(async () => {
    if (!name.trim()) { setError(t('editor.nameRequired')); return }
    if (!svgCode.trim()) { setError(t('editor.svgRequired')); return }
    setSaving(true)
    setError(null)
    try {
      await onSave(name.trim(), sanitizeSvg(svgCode))
    } catch (err) {
      log.ui.error('shape save failed', err)
      setError(t('editor.saveFailed'))
    } finally {
      setSaving(false)
    }
  }, [name, svgCode, onSave, t])

  return (
    <div className="flex flex-col gap-4 p-4" dir="ltr">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-[var(--color-content-muted)]">
          {t('editor.shapeName')}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('editor.namePlaceholder')}
          className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-content)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-[var(--color-content-muted)]">
          {t('editor.uploadSvg')}
        </label>
        <input
          type="file"
          accept=".svg,image/svg+xml"
          onChange={handleFileUpload}
          className="text-sm text-[var(--color-content-muted)] file:me-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[var(--color-primary)] file:text-[var(--color-primary-fg)] file:font-semibold file:cursor-pointer"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-1 min-h-0">
          <label className="text-sm font-semibold text-[var(--color-content-muted)]">
            {t('editor.svgCode')}
          </label>
          <SvgCodeEditor value={svgCode} onChange={setSvgCode} />
        </div>

        <div className="flex flex-col gap-1 md:w-48 shrink-0">
          <label className="text-sm font-semibold text-[var(--color-content-muted)]">
            {t('editor.preview')}
          </label>
          <div className="w-full md:w-48 aspect-square rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-raised)] flex items-center justify-center overflow-hidden p-3">
            <div
              className="w-full h-full flex items-center justify-center text-[var(--color-primary)]"
              dangerouslySetInnerHTML={{ __html: sanitized }}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-content)] hover:bg-[var(--color-surface-alt)] transition-colors"
        >
          {t('editor.cancel')}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-semibold hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50"
        >
          {saving ? t('editor.saving') : t('editor.save')}
        </button>
      </div>
    </div>
  )
}
