import { makeShape } from '../makeShape'

export const lightning = makeShape(
  { id: 'lightning', name: 'Lightning', source: 'builtin', viewBox: '0 0 100 100' },
  ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) =>
    `<polygon points="58,5 28,52 48,52 42,95 72,48 52,48" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" opacity="${opacity}" transform="rotate(${rotation}, 50, 50)"/>`,
)
