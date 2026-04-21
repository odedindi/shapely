import { makeShape } from '../makeShape'

function polygonPoints(cx: number, cy: number, r: number, sides: number, offsetDeg = -90) {
  return Array.from({ length: sides }, (_, i) => {
    const angle = ((360 / sides) * i + offsetDeg) * (Math.PI / 180)
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')
}

export const pentagon = makeShape(
  { id: 'pentagon', name: 'Pentagon', source: 'builtin', viewBox: '0 0 100 100' },
  ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) =>
    `<polygon points="${polygonPoints(50, 50, 45, 5)}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" opacity="${opacity}" transform="rotate(${rotation}, 50, 50)"/>`,
)
