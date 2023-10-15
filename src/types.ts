import { BehaviorSubject } from 'rxjs'
import { Vec2 } from './vec2.js'

export interface Camera {
  position: Vec2
  zoom: number
}

export enum CellType {
  Grass1 = 'grass-1',
  Grass2 = 'grass-2',
  Grass3 = 'grass-3',
  WaterDeep = 'water-deep',
  WaterShallow = 'water-shallow',
}

export interface Cell {
  type: CellType
  entityId?: EntityId
}

export type ChunkId = string
export interface Chunk {
  id: ChunkId
  position: Vec2
  cells: Cell[]
}

export interface Config {
  showGrid: boolean
}

export enum EntityType {
  House = 'house',
  Tree = 'tree',
}

export interface BuildState {
  entityType: EntityType
  position: Vec2
  size: Vec2
  valid: boolean
}

export type EntityId = string

export interface BaseEntity {
  id: EntityId
  type: EntityType
  position: Vec2
  size: Vec2
}

export interface HouseEntity extends BaseEntity {
  type: EntityType.House
}

export interface TreeEntity extends BaseEntity {
  type: EntityType.Tree
}

export type Entity = HouseEntity | TreeEntity

export type AgentId = string

export interface Agent {
  id: AgentId
  position: Vec2
}

export enum PointerMode {
  Move = 'move',
  Select = 'select',
}

export interface Select {
  start: Vec2
  end?: Vec2
}

export interface BoundingBox {
  tl: Vec2
  br: Vec2
}

export enum JobType {
  CutTrees = 'cut-trees',
}

export type JobId = string

export interface BaseJob {
  id: JobId
}

export interface CutTreesJob extends BaseJob {
  type: JobType.CutTrees
}

export type Job = CutTreesJob
