import { makeShape } from '../makeShape'

export const triangleEquilateral = makeShape(
  { id: 'triangle-equilateral', name: 'Triangle', source: 'builtin', viewBox: '0 0 100 100' },
  ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) =>
    `<polygon points="50,8 95,92 5,92" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" opacity="${opacity}" transform="rotate(${rotation}, 50, 50)"/>`,
)
