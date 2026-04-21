import { makeShape } from '../makeShape'

export const crescent = makeShape(
  { id: 'crescent', name: 'Crescent', source: 'builtin', viewBox: '0 0 100 100' },
  ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) =>
    `<path d="M50,5 A45,45 0 1,0 50,95 A30,30 0 1,1 50,5 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}" transform="rotate(${rotation}, 50, 50)"/>`,
)
