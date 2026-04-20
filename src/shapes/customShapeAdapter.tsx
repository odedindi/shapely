import type { ShapeDefinition, CustomShapeRecord, ShapeRenderParams } from '@/shapes/types'

export function customShapeRecordToDefinition(record: CustomShapeRecord): ShapeDefinition {
  return {
    id: record.id,
    name: record.name,
    source: 'custom',
    render: (params: ShapeRenderParams) => (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        opacity={params.opacity}
        style={{ transform: `rotate(${params.rotation}deg)` }}
        dangerouslySetInnerHTML={{ __html: sanitizeSvgContent(record.svgContent, params) }}
      />
    ),
  }
}

function sanitizeSvgContent(svgContent: string, params: ShapeRenderParams): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<svg>${svgContent}</svg>`, 'image/svg+xml')
  const elements = doc.querySelectorAll('*')
  elements.forEach((el) => {
    if (!el.hasAttribute('fill') || el.getAttribute('fill') === 'none') return
    el.setAttribute('fill', params.fillColor)
    el.setAttribute('stroke', params.strokeColor)
    el.setAttribute('stroke-width', String(params.strokeWidth))
  })
  return doc.documentElement.innerHTML
}
