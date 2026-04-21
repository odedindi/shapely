import type { ShapeDefinition } from '../types'

export const moon: ShapeDefinition = {
  id: 'moon',
  name: 'Moon',
  source: 'builtin',
  render: ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <path
        d="M60,10 A40,40 0 1,0 60,90 A28,28 0 1,1 60,10 Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={opacity}
        transform={`rotate(${rotation}, 50, 50)`}
      />
    </svg>
  ),
}
