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

export default function ShapeCombiner({ shapeA, shapeB, paramsA, paramsB, mode }: ShapeCombinerProps) {
  const uid = useId().replace(/:/g, '')

  if (mode === 'overlay') {
    const shadowId = `${uid}-shadow`
    const paramsB2: ShapeRenderParams = { ...paramsB, opacity: paramsB.opacity * 0.95 }
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${VB} ${VB}`} overflow="visible">
        <defs>
          <filter id={shadowId} x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.28" />
          </filter>
        </defs>
        <ShapeSlot shape={shapeA} params={paramsA} x={0} y={0} size={VB} />
        <g transform="rotate(30 50 50)" filter={`url(#${shadowId})`}>
          <ShapeSlot shape={shapeB} params={paramsB2} x={15} y={15} size={70} />
        </g>
      </svg>
    )
  }

  if (mode === 'silhouette') {
    const silA: ShapeRenderParams = { ...paramsA, opacity: 0.72, strokeWidth: Math.max(1, paramsA.strokeWidth * 0.5) }
    const silB: ShapeRenderParams = { ...paramsB, opacity: 0.6, strokeWidth: Math.max(1, paramsB.strokeWidth * 0.5) }
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${VB} ${VB}`} overflow="visible">
        <ShapeSlot shape={shapeA} params={silA} x={0} y={0} size={VB} />
        <g transform="rotate(18 50 50)">
          <ShapeSlot shape={shapeB} params={silB} x={8} y={8} size={84} />
        </g>
      </svg>
    )
  }

  if (mode === 'nested') {
    const frameA: ShapeRenderParams = { ...paramsA, fillColor: 'none' }
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${VB} ${VB}`} overflow="visible">
        <ShapeSlot shape={shapeA} params={frameA} x={0} y={0} size={VB} />
        <g transform="rotate(22.5 50 50)">
          <ShapeSlot shape={shapeB} params={paramsB} x={26} y={26} size={48} />
        </g>
      </svg>
    )
  }

  if (mode === 'fill') {
    const clipId = `${uid}-clip`
    const patId = `${uid}-pat`

    const clipColor = paramsA.fillColor

    const clipBody = shapeA.svgBody({ ...paramsA, fillColor: 'white', strokeColor: 'white', strokeWidth: 0, opacity: 1 })
    const tileBody = shapeB.svgBody({ ...paramsB, strokeColor: 'none', strokeWidth: 0 })

    const [, , vbAW, vbAH] = shapeA.viewBox.split(' ').map(Number)
    const [, , vbBW, vbBH] = shapeB.viewBox.split(' ').map(Number)
    const clipScaleX = VB / vbAW
    const clipScaleY = VB / vbAH
    const tileScaleX = TILE / vbBW
    const tileScaleY = TILE / vbBH

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${VB} ${VB}`}>
        <defs>
          <clipPath id={clipId}>
            <g
              transform={`scale(${clipScaleX} ${clipScaleY})`}
              dangerouslySetInnerHTML={{ __html: clipBody }}
            />
          </clipPath>
          <pattern id={patId} x="0" y="0" width={TILE} height={TILE} patternUnits="userSpaceOnUse">
            <rect width={TILE} height={TILE} fill={clipColor} opacity="0.25" />
            <g
              transform={`scale(${tileScaleX} ${tileScaleY})`}
              dangerouslySetInnerHTML={{ __html: tileBody }}
            />
          </pattern>
        </defs>
        <rect width={VB} height={VB} fill={`url(#${patId})`} clipPath={`url(#${clipId})`} />
      </svg>
    )
  }

  return (
    <svg width="100%" height="100%" viewBox="0 0 210 100">
      <ShapeSlot shape={shapeA} params={paramsA} x={0} y={0} size={100} />
      <line x1="105" y1="15" x2="105" y2="85" stroke="var(--color-border)" strokeWidth="1.5" opacity="0.6" />
      <ShapeSlot shape={shapeB} params={paramsB} x={110} y={0} size={100} />
    </svg>
  )
}
