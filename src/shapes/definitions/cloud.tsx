import { makeShape } from '../makeShape'

export const cloud = makeShape(
  { id: 'cloud', name: 'Cloud', source: 'builtin', viewBox: '0 0 100 100' },
  ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) =>
    `<path d="M25,70 Q10,70 10,55 Q10,42 22,40 Q22,22 40,22 Q52,22 57,32 Q62,28 70,28 Q84,28 84,42 Q92,44 92,55 Q92,70 75,70 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" opacity="${opacity}" transform="rotate(${rotation}, 50, 50)"/>`,
)
