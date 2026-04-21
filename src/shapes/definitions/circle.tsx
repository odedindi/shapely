import { makeShape } from '../makeShape'

export const circle = makeShape(
  { id: 'circle', name: 'Circle', source: 'builtin', viewBox: '0 0 100 100' },
  ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) =>
    `<circle cx="50" cy="50" r="${45 - strokeWidth / 2}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}" transform="rotate(${rotation}, 50, 50)"/>`,
)
