import type { ShapeDefinition } from '../types'

export const cross: ShapeDefinition = {
  id: 'cross',
  name: 'Cross',
  source: 'builtin',
  render: ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <path
        d="M35,5 H65 V35 H95 V65 H65 V95 H35 V65 H5 V35 H35 Z"
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
