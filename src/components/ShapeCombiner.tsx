import { useId } from 'react'
import type { ShapeDefinition, ShapeRenderParams, CombinationStyle } from '@/shapes/types'

interface ShapeCombinerProps {
  shapeA: ShapeDefinition
  shapeB: ShapeDefinition
  paramsA: ShapeRenderParams
  paramsB: ShapeRenderParams
  mode: CombinationStyle
}

const TILE_COUNT = 5
const VB = 100
const TILE = VB / TILE_COUNT

function ShapeSlot({
  shape, params, x, y, size,
}: { shape: ShapeDefinition; params: ShapeRenderParams; x: number; y: number; size: number }) {
  const body = shape.svgBody(params)
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={shape.viewBox} overflow="visible">
      <g dangerouslySetInnerHTML={{ __html: body }} />
    </svg>
  )
}

/**
 * Stable swap decision: returns true when shapeA should take the "secondary" role.
 * Deterministic per pair — same result every render for a given (idA, idB).
 */
function shouldSwap(idA: string, idB: string): boolean {
  return idA > idB
}

export default function ShapeCombiner({ shapeA, shapeB, paramsA, paramsB, mode }: ShapeCombinerProps) {
  const uid = useId().replace(/:/g, '')
  const swap = shouldSwap(shapeA.id, shapeB.id)

  if (mode === 'overlay') {
    const shadowId = `${uid}-shadow`
    // swap determines which shape is large (back) and which is small+rotated (front)
    const [back, backP, front, frontP] = swap
      ? [shapeB, paramsB, shapeA, paramsA]
      : [shapeA, paramsA, shapeB, paramsB]
    const frontP2: ShapeRenderParams = { ...frontP, opacity: frontP.opacity * 0.92 }
    const rotation = swap ? -30 : 30
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${VB} ${VB}`} overflow="visible">
        <defs>
          <filter id={shadowId} x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.32" />
          </filter>
        </defs>
        <ShapeSlot shape={back} params={backP} x={0} y={0} size={VB} />
        <g transform={`rotate(${rotation} 50 50)`} filter={`url(#${shadowId})`}>
          <ShapeSlot shape={front} params={frontP2} x={14} y={14} size={72} />
        </g>
      </svg>
    )
  }

  if (mode === 'silhouette') {
    // Offset the two shapes so they overlap ~40% in the centre (Venn-style)
    // swap decides which is upper-left vs lower-right
    const [first, firstP, second, secondP] = swap
      ? [shapeB, paramsB, shapeA, paramsA]
      : [shapeA, paramsA, shapeB, paramsB]
    const firstP2: ShapeRenderParams = { ...firstP, opacity: 0.82 }
    const secondP2: ShapeRenderParams = { ...secondP, opacity: 0.72 }
    const SIZE = 72
    const OFFSET = 28  // second shape offset from top-left of first
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${VB} ${VB}`} overflow="visible">
        <ShapeSlot shape={first} params={firstP2} x={0} y={0} size={SIZE} />
        <ShapeSlot shape={second} params={secondP2} x={OFFSET} y={OFFSET} size={SIZE} />
      </svg>
    )
  }

  if (mode === 'nested') {
    // swap decides which shape is the container (outline) and which is nested inside
    const [container, containerP, inner, innerP] = swap
      ? [shapeB, paramsB, shapeA, paramsA]
      : [shapeA, paramsA, shapeB, paramsB]
    const frameP: ShapeRenderParams = {
      ...containerP,
      fillColor: 'none',
      strokeWidth: Math.max(containerP.strokeWidth, 3),
    }
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${VB} ${VB}`} overflow="visible">
        <ShapeSlot shape={container} params={frameP} x={0} y={0} size={VB} />
        <ShapeSlot shape={inner} params={innerP} x={27} y={27} size={46} />
      </svg>
    )
  }

  if (mode === 'fill') {
    const maskId = `${uid}-mask`
    const patId = `${uid}-pat`

    const [, , vbW, vbH] = shapeA.viewBox.split(' ').map(Number)
    const [, , vbTW, vbTH] = shapeB.viewBox.split(' ').map(Number)
    const clipScale = `scale(${VB / vbW} ${VB / vbH})`
    const tileScale = `scale(${TILE / vbTW} ${TILE / vbTH})`

    const clipBody = shapeA.svgBody({ ...paramsA, fillColor: 'white', strokeColor: 'white', strokeWidth: 0, opacity: 1 })
    const tileBody = shapeB.svgBody({ ...paramsB, strokeColor: 'none', strokeWidth: 0 })

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${VB} ${VB}`}>
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width={VB} height={VB}>
            <rect width={VB} height={VB} fill="black" />
            <g transform={clipScale} dangerouslySetInnerHTML={{ __html: clipBody }} />
          </mask>
          <pattern id={patId} x="0" y="0" width={TILE} height={TILE} patternUnits="userSpaceOnUse">
            <rect width={TILE} height={TILE} fill={paramsA.fillColor} opacity="0.25" />
            <g transform={tileScale} dangerouslySetInnerHTML={{ __html: tileBody }} />
          </pattern>
        </defs>
        <rect width={VB} height={VB} fill={`url(#${patId})`} mask={`url(#${maskId})`} />
      </svg>
    )
  }

  // side-by-side: render both shapes in their own 100×100 viewBox so visual weight is normalized
  const HALF = 100
  const GAP = 10
  const TOTAL_W = HALF * 2 + GAP
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${TOTAL_W} ${HALF}`}>
      <svg x={0} y={0} width={HALF} height={HALF} viewBox={shapeA.viewBox} overflow="visible">
        <g dangerouslySetInnerHTML={{ __html: shapeA.svgBody(paramsA) }} />
      </svg>
      <line
        x1={HALF + GAP / 2} y1={15}
        x2={HALF + GAP / 2} y2={85}
        stroke="var(--color-border)" strokeWidth="1.5" opacity="0.5"
      />
      <svg x={HALF + GAP} y={0} width={HALF} height={HALF} viewBox={shapeB.viewBox} overflow="visible">
        <g dangerouslySetInnerHTML={{ __html: shapeB.svgBody(paramsB) }} />
      </svg>
    </svg>
  )
}
