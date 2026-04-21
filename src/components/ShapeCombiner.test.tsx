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

  it('shapeB slot is inset and smaller than shapeA (70% size)', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="overlay" />
    )
    const allSlots = container.querySelectorAll<SVGSVGElement>('svg svg')
    const slotB = allSlots[allSlots.length - 1]
    const w = Number(slotB.getAttribute('width'))
    const h = Number(slotB.getAttribute('height'))
    expect(w).toBeLessThan(100)
    expect(h).toBeLessThan(100)
    expect(w).toBe(70)
    expect(h).toBe(70)
  })

  it('shapeB slot is centered (x=y=15)', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="overlay" />
    )
    const allSlots = container.querySelectorAll<SVGSVGElement>('svg svg')
    const slotB = allSlots[allSlots.length - 1]
    expect(Number(slotB.getAttribute('x'))).toBe(15)
    expect(Number(slotB.getAttribute('y'))).toBe(15)
  })

  it('shapeB is wrapped in a rotate(30) group', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="overlay" />
    )
    const rotatedGroup = container.querySelector('g[transform*="rotate(30"]')
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

  it('shapeA fills full 100x100 slot', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="silhouette" />
    )
    const slotA = container.querySelector<SVGSVGElement>('svg > svg')!
    expect(slotA.getAttribute('width')).toBe('100')
    expect(slotA.getAttribute('height')).toBe('100')
  })

  it('shapeB slot is slightly inset from edges', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="silhouette" />
    )
    const allSlots = container.querySelectorAll<SVGSVGElement>('svg svg')
    const slotB = allSlots[allSlots.length - 1]
    expect(Number(slotB.getAttribute('x'))).toBeGreaterThan(0)
    expect(Number(slotB.getAttribute('y'))).toBeGreaterThan(0)
    expect(Number(slotB.getAttribute('width'))).toBeLessThan(100)
  })

  it('shapeB is wrapped in a rotate(18) group', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="silhouette" />
    )
    expect(container.querySelector('g[transform*="rotate(18"]')).toBeTruthy()
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

  it('shapeB slot is centered within shapeA bounds', () => {
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
  })

  it('shapeB is wrapped in a rotate(22.5) group', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="nested" />
    )
    expect(container.querySelector('g[transform*="rotate(22.5"]')).toBeTruthy()
  })
})

describe('ShapeCombiner — fill mode', () => {
  it('renders a <clipPath> and <pattern>', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="fill" />
    )
    expect(container.querySelector('clipPath')).toBeTruthy()
    expect(container.querySelector('pattern')).toBeTruthy()
  })

  it('clipPath contains shapeA body with white fill', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="fill" />
    )
    const clipCircle = container.querySelector('clipPath circle')!
    expect(clipCircle.getAttribute('fill')).toBe('white')
  })

  it('pattern tile has a background rect for CSS-var color resolution', () => {
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
    // The shape's fill attribute must contain the color value directly —
    // not "currentColor", which cannot resolve CSS vars in SVG attribute context.
    const tileCircle = container.querySelector('pattern circle')!
    expect(tileCircle).toBeTruthy()
    expect(tileCircle.getAttribute('fill')).toBe(cssVar)
  })

  it('pattern tile size equals VB / TILE_COUNT (20)', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="fill" />
    )
    const pattern = container.querySelector('pattern')!
    expect(Number(pattern.getAttribute('width'))).toBe(20)
    expect(Number(pattern.getAttribute('height'))).toBe(20)
  })

  it('the fill rect references both pattern and clipPath', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="fill" />
    )
    const rect = container.querySelector('rect:not(pattern rect)')!
    expect(rect.getAttribute('fill')).toMatch(/url\(#/)
    expect(rect.getAttribute('clip-path')).toMatch(/url\(#/)
  })

  it('clipPath shape body has no fill="currentColor" — MDI icon paths must use resolved color', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA_mdi} shapeB={shapeB} paramsA={{ ...baseParams, fillColor: 'white' }} paramsB={baseParams} mode="fill" />
    )
    const clipPath = container.querySelector('clipPath')!
    // "currentColor" cannot resolve CSS vars in SVG presentation attributes.
    // Any fill inside a <clipPath> must be an explicit color value.
    expect(clipPath.innerHTML).not.toContain('fill="currentColor"')
  })

  it('clipPath contains a <g> with scale transform mapping shapeA viewBox to 100x100', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA_mdi} shapeB={shapeB} paramsA={baseParams} paramsB={baseParams} mode="fill" />
    )
    const clipG = container.querySelector('clipPath g[transform]')!
    expect(clipG).toBeTruthy()
    // MDI viewBox is 24x24; VB=100 → scale ≈ 4.166...
    const transform = clipG.getAttribute('transform') ?? ''
    expect(transform).toMatch(/scale\(/)
    const scaleMatch = transform.match(/scale\(([\d.]+)/)
    expect(scaleMatch).toBeTruthy()
    expect(Number(scaleMatch![1])).toBeCloseTo(100 / 24, 2)
  })

  it('pattern contains a <g> with scale transform mapping shapeB viewBox to tile size', () => {
    const { container } = render(
      <ShapeCombiner shapeA={shapeA} shapeB={shapeB_mdi} paramsA={baseParams} paramsB={baseParams} mode="fill" />
    )
    const patG = container.querySelector('pattern g[transform]')!
    expect(patG).toBeTruthy()
    // MDI viewBox is 24x24; TILE=20 → scale ≈ 0.833...
    const transform = patG.getAttribute('transform') ?? ''
    expect(transform).toMatch(/scale\(/)
    const scaleMatch = transform.match(/scale\(([\d.]+)/)
    expect(scaleMatch).toBeTruthy()
    expect(Number(scaleMatch![1])).toBeCloseTo(20 / 24, 2)
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
