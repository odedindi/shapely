import type { ShapeDefinition, CustomShapeRecord, ShapeRenderParams } from '@/shapes/types'

export function customShapeRecordToDefinition(record: CustomShapeRecord): ShapeDefinition {
  const viewBox = '0 0 100 100'

  const svgBody = (params: ShapeRenderParams) =>
    sanitizeSvgContent(record.svgContent, params)

  return {
    id: record.id,
    name: record.name,
    source: 'custom',
    viewBox,
    svgBody,
    render: (params: ShapeRenderParams) => (
      <svg
        width="100%"
        height="100%"
        viewBox={viewBox}
        opacity={params.opacity}
        style={{ transform: `rotate(${params.rotation}deg)` }}
        dangerouslySetInnerHTML={{ __html: svgBody(params) }}
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
