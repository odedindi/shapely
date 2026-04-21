import type { ShapeDefinition } from './types'
import { triangleRight } from './definitions/triangle-right'
import { arrow } from './definitions/arrow'
import { crescent } from './definitions/crescent'
import { parallelogram } from './definitions/parallelogram'
import { trapezoid } from './definitions/trapezoid'
import { oval } from './definitions/oval'
import { MDI_SHAPES } from './definitions/mdi-shapes'

const HANDCRAFTED_SHAPES: ShapeDefinition[] = [
  triangleRight,
  arrow,
  crescent,
  parallelogram,
  trapezoid,
  oval,
]

export const BUILTIN_SHAPES: ShapeDefinition[] = [
  ...MDI_SHAPES,
  ...HANDCRAFTED_SHAPES,
]
