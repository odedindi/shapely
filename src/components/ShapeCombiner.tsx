import type { ShapeDefinition, ShapeRenderParams, CombinationStyle } from '@/shapes/types'

interface ShapeCombinerProps {
  shapeA: ShapeDefinition
  shapeB: ShapeDefinition
  paramsA: ShapeRenderParams
  paramsB: ShapeRenderParams
  mode: CombinationStyle
}

export default function ShapeCombiner({ shapeA, shapeB, paramsA, paramsB, mode }: ShapeCombinerProps) {
  if (mode === 'overlay') {
    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible">
        <foreignObject x="0" y="0" width="100" height="100">
          {shapeA.render(paramsA)}
        </foreignObject>
        <foreignObject
          x="11"
          y="11"
          width="78"
          height="78"
          transform="rotate(30 50 50)"
          style={{ filter: 'drop-shadow(0px 3px 6px rgba(0,0,0,0.30))' }}
        >
          {shapeB.render(paramsB)}
        </foreignObject>
      </svg>
    )
  }

  if (mode === 'silhouette') {
    const silA: ShapeRenderParams = {
      ...paramsA,
      opacity: 0.72,
      strokeWidth: Math.max(1, paramsA.strokeWidth * 0.5)
    }
    const silB: ShapeRenderParams = {
      ...paramsB,
      opacity: 0.6,
      strokeWidth: Math.max(1, paramsB.strokeWidth * 0.5)
    }
    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible">
        <foreignObject x="0" y="0" width="100" height="100">
          {shapeA.render(silA)}
        </foreignObject>
        <foreignObject
          x="6"
          y="6"
          width="88"
          height="88"
          transform="rotate(18 50 50)"
        >
          {shapeB.render(silB)}
        </foreignObject>
      </svg>
    )
  }

  if (mode === 'nested') {
    const frameA: ShapeRenderParams = { ...paramsA, fillColor: 'none' }
    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible">
        <foreignObject x="0" y="0" width="100" height="100">
          {shapeA.render(frameA)}
        </foreignObject>
        <foreignObject
          x="24"
          y="24"
          width="52"
          height="52"
          transform="rotate(22.5 50 50)"
        >
          {shapeB.render(paramsB)}
        </foreignObject>
      </svg>
    )
  }

  // side-by-side
  return (
    <div className="w-full h-full flex items-center justify-center gap-[6%]">
      <div className="w-[44%] aspect-square flex items-center justify-center">
        {shapeA.render(paramsA)}
      </div>
      <div className="w-[1px] h-[60%] bg-[var(--color-border)] rounded-full opacity-60" />
      <div className="w-[44%] aspect-square flex items-center justify-center">
        {shapeB.render(paramsB)}
      </div>
    </div>
  )
}
