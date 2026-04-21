import type { ShapeDefinition, ShapeRenderParams } from './types'

export function makeShape(
  meta: Pick<ShapeDefinition, 'id' | 'name' | 'source' | 'viewBox'>,
  svgBody: (params: ShapeRenderParams) => string,
): ShapeDefinition {
  return {
    ...meta,
    svgBody,
    render: (params) => (
      <svg
        width="100%"
        height="100%"
        viewBox={meta.viewBox}
        xmlns="http://www.w3.org/2000/svg"
        dangerouslySetInnerHTML={{ __html: svgBody(params) }}
      />
    ),
  }
}
