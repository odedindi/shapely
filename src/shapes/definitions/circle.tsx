import type { ShapeDefinition } from '../types'

export const circle: ShapeDefinition = {
  id: 'circle',
  name: 'Circle',
  source: 'builtin',
  render: ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r={45 - strokeWidth / 2}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={opacity}
        transform={`rotate(${rotation}, 50, 50)`}
      />
    </svg>
  ),
}
