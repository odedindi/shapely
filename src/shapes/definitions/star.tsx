import { makeShape } from '../makeShape'

function starPoints(cx: number, cy: number, outerR: number, innerR: number, points: number) {
  const step = Math.PI / points
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = i * step - Math.PI / 2
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')
}

export const star = makeShape(
  { id: 'star', name: 'Star', source: 'builtin', viewBox: '0 0 100 100' },
  ({ fillColor, strokeColor, strokeWidth, rotation, opacity }) =>
    `<polygon points="${starPoints(50, 50, 45, 18, 5)}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" opacity="${opacity}" transform="rotate(${rotation}, 50, 50)"/>`,
)
