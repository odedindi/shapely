import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { EditorView, basicSetup } from 'codemirror'
import { xml } from '@codemirror/lang-xml'
import { linter, lintGutter } from '@codemirror/lint'
import { svgTagNames } from 'svg-tag-names'
import { svgElementAttributes } from 'svg-element-attributes'
import { oneDark } from '@codemirror/theme-one-dark'
import type { CustomShapeRecord } from '@/shapes/types'
import { normalizeSvgContent } from '@/shapes/svgNormalize'
import { log } from '@/lib/logger'

// Re-implemented locally to avoid a circular import from customShapeAdapter
function applyParamsToBody(body: string, params: PreviewParams): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<svg>${body}</svg>`, 'image/svg+xml')
  const elements = doc.querySelectorAll('*')
  elements.forEach((el) => {
    if (!el.hasAttribute('fill') || el.getAttribute('fill') === 'none') return
    el.setAttribute('fill', params.fillColor)
    el.setAttribute('stroke', params.strokeColor)
    el.setAttribute('stroke-width', String(params.strokeWidth))
  })
  return doc.documentElement.innerHTML
}

interface ShapeEditorProps {
  record?: CustomShapeRecord
  onSave: (name: string, svgBody: string, viewBox: string) => Promise<void>
  onCancel: () => void
}

interface PreviewParams {
  size: number
  strokeWidth: number
  rotation: number
  fillColor: string
  strokeColor: string
  opacity: number
}

const DEFAULT_PARAMS: PreviewParams = {
  size: 60,
  strokeWidth: 2,
  rotation: 0,
  fillColor: '#6366f1',
  strokeColor: '#94a3b8',
  opacity: 1,
}

const PLACEHOLDER_SVG = `<circle cx="50" cy="50" r="40" fill="currentColor"/>`

const PLACEHOLDER_VIEWBOX = '0 0 100 100'

const svgElements = svgTagNames.map(tag => ({
  name: tag,
  attributes: ((svgElementAttributes as Record<string, string[]>)[tag] ?? []).map((attr: string) => ({ name: attr }))
}))
const globalAttrs = ((svgElementAttributes as Record<string, string[]>)['*'] ?? []).map((attr: string) => ({ name: attr, global: true }))
const svgLangExtension = xml({ elements: svgElements, attributes: globalAttrs, autoCloseTags: true })

const svgLinter = linter((view) => {
  const text = view.state.doc.toString()
  if (!text.trim()) return []
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<svg>${text}</svg>`, 'image/svg+xml')
  const errorNode = doc.querySelector('parsererror')
  if (!errorNode) return []
  const msg = errorNode.textContent ?? 'Invalid SVG'
  // Try to extract line number from error message
  const lineMatch = msg.match(/line (\d+)/i)
  const lineNum = lineMatch ? parseInt(lineMatch[1], 10) - 1 : 1 // -1 because we wrapped in <svg>
  const line = view.state.doc.line(Math.max(1, Math.min(lineNum, view.state.doc.lines)))
  return [{ from: line.from, to: line.to, severity: 'error' as const, message: msg.trim() }]
})

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
        svgLangExtension,
        svgLinter,
        lintGutter(),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString())
          }
        }),
        EditorView.theme({
          '&': { 
            height: '100%', 
            minHeight: '300px',
            fontSize: '13px',
            backgroundColor: 'var(--color-surface-alt)',
          },
          '.cm-gutters': { backgroundColor: 'var(--color-surface-alt)', borderRight: '1px solid var(--color-border)' },
          '.cm-scroller': { overflow: 'auto', fontFamily: 'ui-monospace, monospace' },
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
      className="rounded-lg overflow-hidden border border-[var(--color-border)] flex-1 min-h-[300px] flex flex-col"
      dir="ltr"
    />
  )
}

interface PreviewTileProps {
  body: string
  viewBox: string
  params: PreviewParams
  label: string
  mode: 'overlay' | 'silhouette' | 'nested' | 'side-by-side'
}

const VB = 100

function PreviewTile({ body, viewBox, params, label, mode }: PreviewTileProps) {
  const { fillColor, strokeColor, strokeWidth, rotation, opacity, size } = params

  const primaryBody = applyParamsToBody(body, { ...params, fillColor, strokeColor })
  const secondaryBody = applyParamsToBody(body, { ...params, fillColor: strokeColor, strokeColor: fillColor })

  let svgContent: React.ReactNode

  if (mode === 'overlay') {
    const frontSize = VB * 0.72
    const frontOffset = (VB - frontSize) / 2
    svgContent = (
      <svg width="100%" height="100%" viewBox={`0 0 ${VB} ${VB}`} overflow="visible">
        <svg x={0} y={0} width={VB} height={VB} viewBox={viewBox} opacity={opacity}
          style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '50% 50%' }}
          dangerouslySetInnerHTML={{ __html: primaryBody }}
        />
        <g transform={`rotate(30 50 50)`} opacity={opacity * 0.85}>
          <svg x={frontOffset} y={frontOffset} width={frontSize} height={frontSize} viewBox={viewBox}
            dangerouslySetInnerHTML={{ __html: secondaryBody }}
          />
        </g>
      </svg>
    )
  } else if (mode === 'silhouette') {
    const SIZE = VB * 0.72
    const OFFSET = VB * 0.28
    svgContent = (
      <svg width="100%" height="100%" viewBox={`0 0 ${VB} ${VB}`} overflow="visible">
        <svg x={0} y={0} width={SIZE} height={SIZE} viewBox={viewBox} opacity={0.82}
          dangerouslySetInnerHTML={{ __html: primaryBody }}
        />
        <svg x={OFFSET} y={OFFSET} width={SIZE} height={SIZE} viewBox={viewBox} opacity={0.72}
          dangerouslySetInnerHTML={{ __html: secondaryBody }}
        />
      </svg>
    )
  } else if (mode === 'nested') {
    const innerSize = VB * 0.46
    const innerOffset = (VB - innerSize) / 2
    const frameBody = applyParamsToBody(body, { ...params, fillColor: 'none', strokeColor: fillColor, strokeWidth: Math.max(strokeWidth, 3) })
    svgContent = (
      <svg width="100%" height="100%" viewBox={`0 0 ${VB} ${VB}`} overflow="visible">
        <svg x={0} y={0} width={VB} height={VB} viewBox={viewBox}
          dangerouslySetInnerHTML={{ __html: frameBody }}
        />
        <svg x={innerOffset} y={innerOffset} width={innerSize} height={innerSize} viewBox={viewBox} opacity={opacity}
          dangerouslySetInnerHTML={{ __html: secondaryBody }}
        />
      </svg>
    )
  } else {
    const HALF = 100
    const GAP = 10
    const TOTAL_W = HALF * 2 + GAP
    svgContent = (
      <svg width="100%" height="100%" viewBox={`0 0 ${TOTAL_W} ${HALF}`}>
        <svg x={0} y={0} width={HALF} height={HALF} viewBox={viewBox} opacity={opacity}
          dangerouslySetInnerHTML={{ __html: primaryBody }}
        />
        <line x1={HALF + GAP / 2} y1={15} x2={HALF + GAP / 2} y2={85}
          stroke="var(--color-border)" strokeWidth="1.5" opacity="0.5"
        />
        <svg x={HALF + GAP} y={0} width={HALF} height={HALF} viewBox={viewBox} opacity={opacity}
          dangerouslySetInnerHTML={{ __html: secondaryBody }}
        />
      </svg>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-full aspect-square rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-raised)] overflow-hidden"
        style={{ padding: `${(100 - size) / 2}%` }}
      >
        {svgContent}
      </div>
      <span className="text-xs text-[var(--color-content-muted)]">{label}</span>
    </div>
  )
}

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  displayValue?: string
}

function SliderRow({ label, value, min, max, step = 1, onChange, displayValue }: SliderRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--color-content-muted)]">{label}</span>
        <span className="text-xs text-[var(--color-content-muted)] tabular-nums">{displayValue ?? value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-primary)] h-1.5 rounded-full"
      />
    </div>
  )
}

export default function ShapeEditor({ record, onSave, onCancel }: ShapeEditorProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(record?.name ?? '')
  const [svgBody, setSvgBody] = useState(record?.svgContent ?? PLACEHOLDER_SVG)
  const [detectedViewBox, setDetectedViewBox] = useState(record?.viewBox ?? PLACEHOLDER_VIEWBOX)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [params, setParams] = useState<PreviewParams>(DEFAULT_PARAMS)

  const sanitized = sanitizeSvg(svgBody)
  function setParam<K extends keyof PreviewParams>(key: K, value: PreviewParams[K]) {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  function handleCodeChange(raw: string) {
    const { viewBox, body } = normalizeSvgContent(sanitizeSvg(raw))
    setDetectedViewBox(viewBox)
    setSvgBody(body)
  }

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result
      if (typeof text === 'string') {
        const { viewBox, body } = normalizeSvgContent(sanitizeSvg(text))
        setDetectedViewBox(viewBox)
        setSvgBody(body)
      }
    }
    reader.onerror = () => {
      log.ui.error('FileReader failed to read SVG file', { fileName: file.name, size: file.size })
    }
    reader.readAsText(file)
  }, [])

  const handleSave = useCallback(async () => {
    if (!name.trim()) { setError(t('editor.nameRequired')); return }
    if (!svgBody.trim()) { setError(t('editor.svgRequired')); return }
    setSaving(true)
    setError(null)
    try {
      await onSave(name.trim(), svgBody, detectedViewBox)
    } catch (err) {
      log.ui.error('shape save failed', err)
      setError(t('editor.saveFailed'))
    } finally {
      setSaving(false)
    }
  }, [name, svgBody, detectedViewBox, onSave, t])

  const previewModes = [
    { mode: 'overlay' as const, label: t('settings.mode.overlay') },
    { mode: 'silhouette' as const, label: t('settings.mode.silhouette') },
    { mode: 'nested' as const, label: t('settings.mode.nested') },
    { mode: 'side-by-side' as const, label: t('settings.mode.sideBySide') },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 h-full" dir="ltr">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4 flex-1 min-h-0">
        
        <div className="flex flex-col gap-4 min-h-0">
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

          <div className="flex flex-col gap-1 flex-1 min-h-0">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[var(--color-content-muted)]">
                {t('editor.svgCode')}
              </label>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--color-surface-alt)] text-[var(--color-content-muted)] border border-[var(--color-border)]">
                viewBox: {detectedViewBox}
              </span>
            </div>
            <SvgCodeEditor value={svgBody} onChange={handleCodeChange} />
          </div>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto ps-1 pe-1 pb-1">
          <div className="flex flex-col gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]">
            <SliderRow
              label={t('editor.size')}
              value={params.size}
              min={20}
              max={100}
              onChange={(v) => setParam('size', v)}
            />
            <SliderRow
              label={t('editor.strokeWidth')}
              value={params.strokeWidth}
              min={0}
              max={10}
              onChange={(v) => setParam('strokeWidth', v)}
            />
            <SliderRow
              label={t('editor.rotation')}
              value={params.rotation}
              min={0}
              max={360}
              onChange={(v) => setParam('rotation', v)}
              displayValue={`${params.rotation}°`}
            />
            <SliderRow
              label={t('editor.opacity')}
              value={params.opacity}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => setParam('opacity', v)}
              displayValue={`${Math.round(params.opacity * 100)}%`}
            />

            <div className="flex gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[var(--color-content-muted)]">
                  {t('editor.fillColor')}
                </span>
                <input
                  type="color"
                  value={params.fillColor}
                  onChange={(e) => setParam('fillColor', e.target.value)}
                  className="w-9 h-9 rounded-lg border border-[var(--color-border)] cursor-pointer bg-transparent p-0.5"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[var(--color-content-muted)]">
                  {t('editor.strokeColor')}
                </span>
                <input
                  type="color"
                  value={params.strokeColor}
                  onChange={(e) => setParam('strokeColor', e.target.value)}
                  className="w-9 h-9 rounded-lg border border-[var(--color-border)] cursor-pointer bg-transparent p-0.5"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--color-content-muted)]">
              {t('editor.preview4')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {previewModes.map(({ mode, label }) => (
                <PreviewTile
                  key={mode}
                  body={sanitized}
                  viewBox={detectedViewBox}
                  params={params}
                  label={label}
                  mode={mode}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-auto border-t border-[var(--color-border)] pt-4">
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
    </div>
  )
}
