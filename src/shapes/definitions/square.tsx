import { makeShape } from '../makeShape'

export const square = makeShape(
  { id: 'square', name: 'Square', source: 'builtin', viewBox: '0 0 100 100' },
  ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) =>
    `<rect x="${5 + strokeWidth / 2}" y="${5 + strokeWidth / 2}" width="${90 - strokeWidth}" height="${90 - strokeWidth}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}" transform="rotate(${rotation}, 50, 50)"/>`,
)
