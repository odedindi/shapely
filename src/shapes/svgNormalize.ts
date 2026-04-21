import type { CustomShapeRecord } from '@/shapes/types'

const FALLBACK_VIEWBOX = '0 0 100 100'

export interface NormalizedSvg {
  viewBox: string
  body: string
}

export function normalizeSvgContent(raw: string): NormalizedSvg {
  const trimmed = raw.trim()

  if (!trimmed.startsWith('<svg')) {
    return { viewBox: FALLBACK_VIEWBOX, body: trimmed }
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(trimmed, 'image/svg+xml')
  const svgEl = doc.documentElement

  const parseError = svgEl.querySelector('parsererror')
  if (parseError) {
    return { viewBox: FALLBACK_VIEWBOX, body: trimmed }
  }

  const viewBox = svgEl.getAttribute('viewBox') ?? FALLBACK_VIEWBOX
  const body = svgEl.innerHTML

  return { viewBox, body }
}

export function migrateLegacyRecord(record: CustomShapeRecord): CustomShapeRecord {
  if (record.viewBox && !record.svgContent.trimStart().startsWith('<svg')) {
    return record
  }

  const { viewBox, body } = normalizeSvgContent(record.svgContent)
  return { ...record, viewBox, svgContent: body }
}
