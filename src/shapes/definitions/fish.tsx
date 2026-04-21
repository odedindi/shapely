import { makeShape } from '../makeShape'

export const fish = makeShape(
  { id: 'fish', name: 'Fish', source: 'builtin', viewBox: '0 0 100 100' },
  ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) =>
    `<g opacity="${opacity}" transform="rotate(${rotation}, 50, 50)">` +
    `<ellipse cx="47" cy="50" rx="30" ry="18" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>` +
    `<polygon points="17,50 5,32 5,68" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>` +
    `<circle cx="68" cy="46" r="4" fill="${strokeColor}"/>` +
    `</g>`,
)
