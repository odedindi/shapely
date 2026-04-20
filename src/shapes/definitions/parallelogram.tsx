import type { ShapeDefinition } from '../types'

export const parallelogram: ShapeDefinition = {
  id: 'parallelogram',
  name: 'Parallelogram',
  source: 'builtin',
  render: ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <polygon
        points="25,10 95,10 75,90 5,90"
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
