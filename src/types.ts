import { Vec2 } from './vec2.js'

export interface Camera {
  position: Vec2
  zoom: number
}

export enum CellType {
  Grass = 'grass',
  Water = 'water',
}

export interface Cell {
  type: CellType
}

export type ChunkId = string
export interface Chunk {
  id: ChunkId
  position: Vec2
  cells: Cell[]
}
