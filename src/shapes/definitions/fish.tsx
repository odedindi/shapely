import type { ShapeDefinition } from '../types'

export const fish: ShapeDefinition = {
  id: 'fish',
  name: 'Fish',
  source: 'builtin',
  render: ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) => (
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <g opacity={opacity} transform={`rotate(${rotation}, 50, 50)`}>
        {/* Body */}
        <ellipse
          cx="47"
          cy="50"
          rx="30"
          ry="18"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        {/* Tail */}
        <polygon
          points="17,50 5,32 5,68"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        {/* Eye */}
        <circle cx="68" cy="46" r="4" fill={strokeColor} />
      </g>
    </svg>
  ),
}
