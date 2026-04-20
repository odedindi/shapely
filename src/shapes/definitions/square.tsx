import type { ShapeDefinition } from '../types'

export const square: ShapeDefinition = {
  id: 'square',
  name: 'Square',
  source: 'builtin',
  render: ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <rect
        x={5 + strokeWidth / 2}
        y={5 + strokeWidth / 2}
        width={90 - strokeWidth}
        height={90 - strokeWidth}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={opacity}
        transform={`rotate(${rotation}, 50, 50)`}
      />
    </svg>
  ),
}
