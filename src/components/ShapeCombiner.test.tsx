import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ShapeCombiner from '@/components/ShapeCombiner'
import type { ShapeDefinition, ShapeRenderParams } from '@/shapes/types'

const baseParams: ShapeRenderParams = {
  fillColor: 'red',
  strokeColor: 'black',
  strokeWidth: 2,
  rotation: 0,
  opacity: 1,
}

function makeTestShape(id: string, viewBox = '0 0 100 100'): ShapeDefinition {
  return {
    id,
    name: id,
    source: 'builtin',
    viewBox,
    svgBody: ({ fillColor, strokeColor, strokeWidth, opacity }) =>
      `<circle data-shape="${id}" cx="50" cy="50" r="40" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`,
    render: () => <svg />,
  }
}

const shapeA = makeTestShape('shapeA')
const shapeB = makeTestShape('shapeB')
const shapeA_mdi = makeTestShape('shapeA-mdi', '0 0 24 24')
const shapeB_mdi = makeTestShape('shapeB-mdi', '0 0 24 24')

function slots(container: HTMLElement) {
  return container.querySelectorAll<SVGSVGElement>('svg > svg, svg > g > svg, svg > g > g > svg')
}

describe('ShapeCombiner — overlay mode', () => {
  it('renders two nested <svg> slots', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="overlay" />
    )
    expect(slots(container).length).toBeGreaterThanOrEqual(2)
  })

  it('shapeA slot fills full 100x100', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="overlay" />
    )
    const outer = container.querySelector('svg')!
    expect(outer.getAttribute('viewBox')).toBe('0 0 100 100')
    const slotA = outer.querySelector<SVGSVGElement>(':scope > svg')!
    expect(slotA.getAttribute('x')).toBe('0')
    expect(slotA.getAttribute('y')).toBe('0')
    expect(slotA.getAttribute('width')).toBe('100')
    expect(slotA.getAttribute('height')).toBe('100')
  })

  it('shapeB slot is inset and smaller than shapeA (72% size)', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="overlay" />
    )
    const allSlots = container.querySelectorAll<SVGSVGElement>('svg svg')
    const slotB = allSlots[allSlots.length - 1]
    const w = Number(slotB.getAttribute('width'))
    const h = Number(slotB.getAttribute('height'))
    expect(w).toBeLessThan(100)
    expect(h).toBeLessThan(100)
    expect(w).toBe(72)
    expect(h).toBe(72)
  })

  it('shapeB slot is inset (x=y=14)', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="overlay" />
    )
    const allSlots = container.querySelectorAll<SVGSVGElement>('svg svg')
    const slotB = allSlots[allSlots.length - 1]
    expect(Number(slotB.getAttribute('x'))).toBe(14)
    expect(Number(slotB.getAttribute('y'))).toBe(14)
  })

  it('shapeB is wrapped in a rotate group (±30 depending on swap)', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="overlay" />
    )
    const rotatedGroup = container.querySelector('g[transform*="rotate(30"]') ?? container.querySelector('g[transform*="rotate(-30"]')
    expect(rotatedGroup).toBeTruthy()
  })

  it('renders a drop-shadow filter', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="overlay" />
    )
    expect(container.querySelector('feDropShadow')).toBeTruthy()
  })

  it('correctly maps MDI (24x24) viewBox into slot', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA_mdi} shapeB={shapeB_mdi} paramsA={baseParams} paramsB={baseParams} mode="overlay" />
    )
    const slotA = container.querySelector<SVGSVGElement>('svg > svg')!
    expect(slotA.getAttribute('viewBox')).toBe('0 0 24 24')
    expect(slotA.getAttribute('width')).toBe('100')
  })
})

describe('ShapeCombiner — silhouette mode', () => {
  it('renders the outer SVG with 100x100 viewBox', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="silhouette" />
    )
    expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 100 100')
  })

  it('applies reduced opacity to both shapes', () => {
    const paramsA2 = { ...baseParams, opacity: 1 }
    const paramsB2 = { ...baseParams, opacity: 1 }
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={paramsA2} paramsB={paramsB2} mode="silhouette" />
    )
    const circles = container.querySelectorAll('circle')
    expect(Number(circles[0].getAttribute('opacity'))).toBeLessThan(1)
    expect(Number(circles[1].getAttribute('opacity'))).toBeLessThan(1)
  })

  it('shapeA slot is 72x72 (Venn-style overlap)', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="silhouette" />
    )
    const slotA = container.querySelector<SVGSVGElement>('svg > svg')!
    expect(slotA.getAttribute('width')).toBe('72')
    expect(slotA.getAttribute('height')).toBe('72')
  })

  it('shapeB slot is offset (Venn overlap, no rotation group)', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="silhouette" />
    )
    const allSlots = container.querySelectorAll<SVGSVGElement>('svg svg')
    const slotB = allSlots[allSlots.length - 1]
    expect(Number(slotB.getAttribute('x'))).toBeGreaterThan(0)
    expect(Number(slotB.getAttribute('y'))).toBeGreaterThan(0)
    expect(Number(slotB.getAttribute('width'))).toBeLessThan(100)
    expect(container.querySelector('g[transform*="rotate"]')).toBeNull()
  })
})

describe('ShapeCombiner — nested mode', () => {
  it('renders the outer SVG with 100x100 viewBox', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="nested" />
    )
    expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 100 100')
  })

  it('shapeA is rendered with fill="none" (outline only)', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="nested" />
    )
    const circles = container.querySelectorAll('circle')
    expect(circles[0].getAttribute('fill')).toBe('none')
  })

  it('shapeB retains its fill color', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={{ ...baseParams, fillColor: 'blue' }} mode="nested" />
    )
    const circles = container.querySelectorAll('circle')
    expect(circles[1].getAttribute('fill')).toBe('blue')
  })

  it('shapeB slot is substantially smaller than shapeA (less than 60% size)', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="nested" />
    )
    const allSlots = container.querySelectorAll<SVGSVGElement>('svg svg')
    const slotB = allSlots[allSlots.length - 1]
    expect(Number(slotB.getAttribute('width'))).toBeLessThan(60)
    expect(Number(slotB.getAttribute('height'))).toBeLessThan(60)
  })

  it('shapeB slot is centered within shapeA bounds (no rotation)', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="nested" />
    )
    const allSlots = container.querySelectorAll<SVGSVGElement>('svg svg')
    const slotB = allSlots[allSlots.length - 1]
    const x = Number(slotB.getAttribute('x'))
    const y = Number(slotB.getAttribute('y'))
    const w = Number(slotB.getAttribute('width'))
    expect(x + w / 2).toBeCloseTo(50, 0)
    expect(y + w / 2).toBeCloseTo(50, 0)
    expect(container.querySelector('g[transform*="rotate"]')).toBeNull()
  })
})

describe('ShapeCombiner — fill mode', () => {
  it('renders a <mask> and <pattern>', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="fill" />
    )
    expect(container.querySelector('mask')).toBeTruthy()
    expect(container.querySelector('pattern')).toBeTruthy()
  })

  it('mask contains a black background rect and shapeA body with white fill', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="fill" />
    )
    const mask = container.querySelector('mask')!
    const blackRect = mask.querySelector('rect')!
    expect(blackRect.getAttribute('fill')).toBe('black')
    const circle = mask.querySelector('circle')!
    expect(circle.getAttribute('fill')).toBe('white')
  })

  it('pattern tile has a background rect using paramsA fillColor', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={{ ...baseParams, fillColor: 'red' }} paramsB={baseParams} mode="fill" />
    )
    const patRect = container.querySelector('pattern rect')!
    expect(patRect).toBeTruthy()
    expect(patRect.getAttribute('fill')).toBe('red')
  })

  it('pattern tile shape body receives fillColor directly (works with CSS vars)', () => {
    const cssVar = 'var(--shape-color-1)'
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={{ ...baseParams, fillColor: cssVar }} mode="fill" />
    )
    const patCircles = container.querySelectorAll('pattern circle')
    expect(patCircles.length).toBeGreaterThan(0)
    expect(patCircles[0].getAttribute('fill')).toBe(cssVar)
  })

  it('pattern tile size equals VB / TILE_COUNT (20)', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="fill" />
    )
    const pattern = container.querySelector('pattern')!
    expect(Number(pattern.getAttribute('width'))).toBe(20)
    expect(Number(pattern.getAttribute('height'))).toBe(20)
  })

  it('the fill rect references both pattern and mask', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="fill" />
    )
    const rect = container.querySelector('rect:not(pattern rect):not(mask rect)')!
    expect(rect.getAttribute('fill')).toMatch(/url\(#/)
    expect(rect.getAttribute('mask')).toMatch(/url\(#/)
  })

  it('mask shape body has no fill="currentColor" — MDI icon paths must use resolved color', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA_mdi} shapeB={shapeB} paramsA={{ ...baseParams, fillColor: 'white' }} paramsB={baseParams} mode="fill" />
    )
    const mask = container.querySelector('mask')!
    expect(mask.innerHTML).not.toContain('fill="currentColor"')
  })

  it('mask clip group scales shapeA (24x24) to fill 100x100 space', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA_mdi} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="fill" />
    )
    const mask = container.querySelector('mask')!
    const scaleGroup = mask.querySelector('g[transform]')!
    expect(scaleGroup).toBeTruthy()
    expect(scaleGroup.getAttribute('transform')).toContain('scale(')
  })

  it('pattern tile group scales shapeB (24x24) to fit tile size 20', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB_mdi} paramsA={baseParams} paramsB={baseParams} mode="fill" />
    )
    const pat = container.querySelector('pattern')!
    const scaleGroup = pat.querySelector('g[transform]')!
    expect(scaleGroup).toBeTruthy()
    expect(scaleGroup.getAttribute('transform')).toContain('scale(')
  })
})

describe('ShapeCombiner — side-by-side mode', () => {
  it('renders wide viewBox (210x100)', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="side-by-side" />
    )
    expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 210 100')
  })

  it('shapeA slot is at x=0', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="side-by-side" />
    )
    const allSlots = container.querySelectorAll<SVGSVGElement>('svg > svg')
    expect(Number(allSlots[0].getAttribute('x'))).toBe(0)
    expect(Number(allSlots[0].getAttribute('width'))).toBe(100)
  })

  it('shapeB slot is at x=110', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="side-by-side" />
    )
    const allSlots = container.querySelectorAll<SVGSVGElement>('svg > svg')
    expect(Number(allSlots[1].getAttribute('x'))).toBe(110)
    expect(Number(allSlots[1].getAttribute('width'))).toBe(100)
  })

  it('renders a divider line between the two shapes', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="side-by-side" />
    )
    const line = container.querySelector('line')!
    expect(Number(line.getAttribute('x1'))).toBeCloseTo(105, 0)
    expect(Number(line.getAttribute('x2'))).toBeCloseTo(105, 0)
  })

  it('both shapes retain their own fill colors independently', () => {
    const { container } = render(
      <ShapeCombiner
        shapeA={shapeA} shapeB={shapeB}
        paramsA={{ ...baseParams, fillColor: 'red' }}
        paramsB={{ ...baseParams, fillColor: 'blue' }}
        mode="side-by-side"
      />
    )
    const circles = container.querySelectorAll('circle')
    expect(circles[0].getAttribute('fill')).toBe('red')
    expect(circles[1].getAttribute('fill')).toBe('blue')
  })
})

describe('ShapeCombiner — viewBox passthrough (cross-coordinate-system)', () => {
  it('overlay: MDI shapes use their own 24x24 viewBox in each slot', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA_mdi} shapeB={shapeB_mdi} paramsA={baseParams} paramsB={baseParams} mode="overlay" />
    )
    const svgSlots = container.querySelectorAll<SVGSVGElement>('svg svg')
    svgSlots.forEach(slot => {
      expect(slot.getAttribute('viewBox')).toBe('0 0 24 24')
    })
  })

  it('nested: mixed viewBoxes each render in correct coordinate space', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB_mdi} paramsA={baseParams} paramsB={baseParams} mode="nested" />
    )
    const svgSlots = container.querySelectorAll<SVGSVGElement>('svg svg')
    expect(svgSlots[0].getAttribute('viewBox')).toBe('0 0 100 100')
    expect(svgSlots[1].getAttribute('viewBox')).toBe('0 0 24 24')
  })
})
