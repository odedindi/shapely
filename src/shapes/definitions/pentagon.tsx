import type { ShapeDefinition } from '../types'

function polygonPoints(cx: number, cy: number, r: number, sides: number, offsetDeg = -90) {
  return Array.from({ length: sides }, (_, i) => {
    const angle = ((360 / sides) * i + offsetDeg) * (Math.PI / 180)
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')
}

export const pentagon: ShapeDefinition = {
  id: 'pentagon',
  name: 'Pentagon',
  source: 'builtin',
  render: ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <polygon
        points={polygonPoints(50, 50, 45, 5)}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        opacity={opacity}
        transform={`rotate(${rotation}, 50, 50)`}
      />
    </svg>
  ),
}
