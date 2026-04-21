import { makeShape } from '../makeShape'

export const oval = makeShape(
  { id: 'oval', name: 'Oval', source: 'builtin', viewBox: '0 0 100 100' },
  ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) =>
    `<ellipse cx="50" cy="50" rx="${43 - strokeWidth / 2}" ry="${28 - strokeWidth / 2}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}" transform="rotate(${rotation}, 50, 50)"/>`,
)
