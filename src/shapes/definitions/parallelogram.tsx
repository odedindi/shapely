import { makeShape } from '../makeShape'

export const parallelogram = makeShape(
  { id: 'parallelogram', name: 'Parallelogram', source: 'builtin', viewBox: '0 0 100 100' },
  ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) =>
    `<polygon points="25,10 95,10 75,90 5,90" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" opacity="${opacity}" transform="rotate(${rotation}, 50, 50)"/>`,
)
