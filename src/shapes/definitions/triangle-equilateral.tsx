import type { ShapeDefinition } from '../types'

export const triangleEquilateral: ShapeDefinition = {
  id: 'triangle-equilateral',
  name: 'Triangle',
  source: 'builtin',
  render: ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <polygon
        points="50,8 95,92 5,92"
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
