import type { ReactElement } from 'react'

export interface ShapeRenderParams {
  size?: number
  fillColor: string
  strokeColor: string
  strokeWidth: number
  rotation: number
  opacity: number
}

export type CombinationStyle = 'overlay' | 'silhouette' | 'nested' | 'side-by-side' | 'fill'
export type CellRevealMode = 'visible' | 'hidden' | 'peek'
export type DarkMode = 'auto' | 'light' | 'dark'
export type Theme = 'default' | 'sunset' | 'forest' | 'ocean' | 'candy' | 'monochrome'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type GamePhase = 'idle' | 'playing' | 'correct' | 'wrong' | 'complete'
export type GameMode = 'unique' | 'weighted'

export interface ShapeDefinition {
  id: string
  name: string
  source: 'builtin' | 'custom'
  viewBox: string
  svgBody: (params: ShapeRenderParams) => string
  render: (params: ShapeRenderParams) => ReactElement
}

export interface CustomShapeRecord {
  id: string
  name: string
  svgContent: string
  createdAt: number
  updatedAt: number
}

export interface BoardState {
  gridSize: number
  columnShapes: ShapeDefinition[]
  rowShapes: ShapeDefinition[]
}

export interface CardState {
  columnShape: ShapeDefinition
  rowShape: ShapeDefinition
  correctCell: { col: number; row: number }
}
