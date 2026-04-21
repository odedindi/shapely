import { icons as mdiIcons } from '@iconify-json/mdi'
import { getIconData } from '@iconify/utils'
import type { ShapeDefinition, ShapeRenderParams } from './types'

function loadMdiIcon(iconName: string): { width: number; height: number; body: string } {
  const data = getIconData(mdiIcons, iconName)
  if (!data) {
    throw new Error(`[iconifyAdapter] MDI icon "${iconName}" not found. Check the icon name at https://icon-sets.iconify.design/mdi/`)
  }
  return { width: data.width ?? 24, height: data.height ?? 24, body: data.body }
}

/**
 * Creates a ShapeDefinition backed by a Material Design Icons icon.
 *
 * @param id          Unique shape ID (used in board state)
 * @param iconName    MDI icon name, e.g. "hexagon", "star", "lightning-bolt"
 * @param displayName Human-readable name shown in UI
 */
export function createMdiShape(id: string, iconName: string, displayName: string): ShapeDefinition {
  const { width, height, body } = loadMdiIcon(iconName)
  const viewBox = `0 0 ${width} ${height}`

  const svgBody = ({ fillColor, strokeColor, strokeWidth, rotation, opacity }: ShapeRenderParams) => {
    const resolvedBody = body.replace(/fill="currentColor"/g, `fill="${fillColor}"`)
    return `<g fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" paint-order="stroke fill" opacity="${opacity}" transform="rotate(${rotation} ${width / 2} ${height / 2})">${resolvedBody}</g>`
  }

  return {
    id,
    name: displayName,
    source: 'builtin',
    viewBox,
    svgBody,
    render: (params) => (
      <svg
        width="100%"
        height="100%"
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
        // Safe: body comes entirely from the @iconify-json/mdi npm package,
        // never from user input.
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: svgBody(params) }}
      />
    ),
  }
}
