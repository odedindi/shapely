import { makeShape } from '../makeShape'

export const leaf = makeShape(
  { id: 'leaf', name: 'Leaf', source: 'builtin', viewBox: '0 0 100 100' },
  ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) =>
    `<path d="M50,8 C80,8 92,30 92,50 C92,70 80,92 50,92 C50,92 8,80 8,50 C8,20 28,8 50,8 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}" transform="rotate(${rotation}, 50, 50)"/>` +
    `<line x1="50" y1="90" x2="50" y2="15" stroke="${strokeColor}" stroke-width="${Math.max(1, strokeWidth * 0.8)}" opacity="${opacity}" transform="rotate(${rotation}, 50, 50)"/>`,
)
