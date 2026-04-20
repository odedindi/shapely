import type { ShapeDefinition } from '../types'

export const arrow: ShapeDefinition = {
  id: 'arrow',
  name: 'Arrow',
  source: 'builtin',
  render: ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <path
        d="M10,38 H62 V20 L92,50 L62,80 V62 H10 Z"
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
