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
      <div className="relative w-full h-full">
        <div className="absolute inset-0 flex items-center justify-center">
          {shapeA.render(paramsA)}
        </div>
        <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: 0.6 }}>
          {shapeB.render(paramsB)}
        </div>
      </div>
    )
  }

  if (mode === 'silhouette') {
    const silA: ShapeRenderParams = { ...paramsA, fillColor: '#000000', strokeColor: '#000000', opacity: 0.5 }
    const silB: ShapeRenderParams = { ...paramsB, fillColor: '#000000', strokeColor: '#000000', opacity: 0.5 }
    return (
      <div className="relative w-full h-full">
        <div className="absolute inset-0 flex items-center justify-center">
          {shapeA.render(silA)}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          {shapeB.render(silB)}
        </div>
      </div>
    )
  }

  if (mode === 'nested') {
    return (
      <div className="relative w-full h-full">
        <div className="absolute inset-0 flex items-center justify-center">
          {shapeA.render(paramsA)}
        </div>
        <div className="absolute inset-[22%] flex items-center justify-center">
          {shapeB.render(paramsB)}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center gap-[4%]">
      <div className="w-[46%] aspect-square">{shapeA.render(paramsA)}</div>
      <div className="w-[46%] aspect-square">{shapeB.render(paramsB)}</div>
    </div>
  )
}
