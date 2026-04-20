import type { ShapeDefinition } from '../types'

export const triangleRight: ShapeDefinition = {
  id: 'triangle-right',
  name: 'Right Triangle',
  source: 'builtin',
  render: ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <polygon
        points="10,90 90,90 10,10"
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
