import { makeShape } from '../makeShape'

export const trapezoid = makeShape(
  { id: 'trapezoid', name: 'Trapezoid', source: 'builtin', viewBox: '0 0 100 100' },
  ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) =>
    `<polygon points="20,10 80,10 95,90 5,90" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" opacity="${opacity}" transform="rotate(${rotation}, 50, 50)"/>`,
)
