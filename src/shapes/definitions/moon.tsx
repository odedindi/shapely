import { makeShape } from '../makeShape'

export const moon = makeShape(
  { id: 'moon', name: 'Moon', source: 'builtin', viewBox: '0 0 100 100' },
  ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) =>
    `<path d="M60,10 A40,40 0 1,0 60,90 A28,28 0 1,1 60,10 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}" transform="rotate(${rotation}, 50, 50)"/>`,
)
