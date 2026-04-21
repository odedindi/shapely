import type { ShapeDefinition } from '../types'

export const leaf: ShapeDefinition = {
  id: 'leaf',
  name: 'Leaf',
  source: 'builtin',
  render: ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <path
        d="M50,8 C80,8 92,30 92,50 C92,70 80,92 50,92 C50,92 8,80 8,50 C8,20 28,8 50,8 Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={opacity}
        transform={`rotate(${rotation}, 50, 50)`}
      />
      <line
        x1="50" y1="90" x2="50" y2="15"
        stroke={strokeColor}
        strokeWidth={Math.max(1, strokeWidth * 0.8)}
        opacity={opacity}
        transform={`rotate(${rotation}, 50, 50)`}
      />
    </svg>
  ),
}
