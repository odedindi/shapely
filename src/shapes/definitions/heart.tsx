import { makeShape } from '../makeShape'

export const heart = makeShape(
  { id: 'heart', name: 'Heart', source: 'builtin', viewBox: '0 0 100 100' },
  ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) =>
    `<path d="M50,85 C50,85 10,60 10,35 C10,20 20,10 35,10 C42,10 48,14 50,18 C52,14 58,10 65,10 C80,10 90,20 90,35 C90,60 50,85 50,85 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" opacity="${opacity}" transform="rotate(${rotation}, 50, 50)"/>`,
)
