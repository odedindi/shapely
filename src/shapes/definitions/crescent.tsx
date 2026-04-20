import type { ShapeDefinition } from '../types'

export const crescent: ShapeDefinition = {
  id: 'crescent',
  name: 'Crescent',
  source: 'builtin',
  render: ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <path
        d="M50,5 A45,45 0 1,0 50,95 A30,30 0 1,1 50,5 Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={opacity}
        transform={`rotate(${rotation}, 50, 50)`}
      />
    </svg>
  ),
}
