import { makeShape } from '../makeShape'

export const arrow = makeShape(
  { id: 'arrow', name: 'Arrow', source: 'builtin', viewBox: '0 0 100 100' },
  ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) =>
    `<path d="M10,38 H62 V20 L92,50 L62,80 V62 H10 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" opacity="${opacity}" transform="rotate(${rotation}, 50, 50)"/>`,
)
