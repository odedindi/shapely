import type { ShapeDefinition } from '../types'

export const oval: ShapeDefinition = {
  id: 'oval',
  name: 'Oval',
  source: 'builtin',
  render: ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <ellipse
        cx="50"
        cy="50"
        rx={43 - strokeWidth / 2}
        ry={28 - strokeWidth / 2}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={opacity}
        transform={`rotate(${rotation}, 50, 50)`}
      />
    </svg>
  ),
}
