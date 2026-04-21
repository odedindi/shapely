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

export default function ShapeCombiner({ shapeA, shapeB, paramsA, paramsB, mode }: ShapeCombinerProps) {
  const uid = useId().replace(/:/g, '')

  if (mode === 'overlay') {
    const bodyA = shapeA.svgBody(paramsA)
    const bodyB = shapeB.svgBody(paramsB)
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${VB} ${VB}`} overflow="visible">
        <g>{bodyA && <g dangerouslySetInnerHTML={{ __html: bodyA }} />}</g>
        <g transform="rotate(30 50 50)" filter={`url(#${uid}-shadow)`}>
          <g transform="translate(11 11) scale(0.78)" dangerouslySetInnerHTML={{ __html: bodyB }} />
        </g>
        <defs>
          <filter id={`${uid}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.30" />
          </filter>
        </defs>
      </svg>
    )
  }

  if (mode === 'silhouette') {
    const silA: ShapeRenderParams = { ...paramsA, opacity: 0.72, strokeWidth: Math.max(1, paramsA.strokeWidth * 0.5) }
    const silB: ShapeRenderParams = { ...paramsB, opacity: 0.6, strokeWidth: Math.max(1, paramsB.strokeWidth * 0.5) }
    const bodyA = shapeA.svgBody(silA)
    const bodyB = shapeB.svgBody(silB)
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${VB} ${VB}`} overflow="visible">
        <g dangerouslySetInnerHTML={{ __html: bodyA }} />
        <g transform="rotate(18 50 50)">
          <g transform="translate(6 6) scale(0.88)" dangerouslySetInnerHTML={{ __html: bodyB }} />
        </g>
      </svg>
    )
  }

  if (mode === 'nested') {
    const frameA: ShapeRenderParams = { ...paramsA, fillColor: 'none' }
    const bodyA = shapeA.svgBody(frameA)
    const bodyB = shapeB.svgBody(paramsB)
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${VB} ${VB}`} overflow="visible">
        <g dangerouslySetInnerHTML={{ __html: bodyA }} />
        <g transform="rotate(22.5 50 50)">
          <g transform="translate(24 24) scale(0.52)" dangerouslySetInnerHTML={{ __html: bodyB }} />
        </g>
      </svg>
    )
  }

  if (mode === 'fill') {
    const clipId = `${uid}-clip`
    const patId = `${uid}-pat`
    const tileSize = VB / TILE_COUNT
    const clipBody = shapeA.svgBody({ ...paramsA, fillColor: 'white', strokeColor: 'white', strokeWidth: 0, opacity: 1 })
    const tileBody = shapeB.svgBody({ ...paramsB, strokeWidth: 0 })

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${VB} ${VB}`}>
        <defs>
          <clipPath id={clipId}>
            <g dangerouslySetInnerHTML={{ __html: clipBody }} />
          </clipPath>
          <pattern id={patId} x="0" y="0" width={tileSize} height={tileSize} patternUnits="userSpaceOnUse">
            <g dangerouslySetInnerHTML={{ __html: tileBody }} />
          </pattern>
        </defs>
        <rect width={VB} height={VB} fill={`url(#${patId})`} clipPath={`url(#${clipId})`} />
      </svg>
    )
  }

  const bodyA = shapeA.svgBody(paramsA)
  const bodyB = shapeB.svgBody(paramsB)
  return (
    <svg width="100%" height="100%" viewBox="0 0 220 100">
      <g transform="scale(0.9) translate(2 5)">
        <g dangerouslySetInnerHTML={{ __html: bodyA }} />
      </g>
      <line x1="108" y1="20" x2="108" y2="80" stroke="var(--color-border)" strokeWidth="1.5" opacity="0.6" />
      <g transform="translate(116 5) scale(0.9)">
        <g dangerouslySetInnerHTML={{ __html: bodyB }} />
      </g>
    </svg>
  )
}
