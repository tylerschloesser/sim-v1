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
  Farm = 'farm',
}

export interface BuildState {
  entityType: EntityType
  position: Vec2
  size: Vec2
  valid: boolean
  force?: boolean
}

export type EntityId = string

export enum EntityStateType {
  Build = 'build',
  Active = 'active',
}

export enum ItemType {
  Wood = 'wood',
}

export interface BuildEntityState {
  type: EntityStateType.Build
  materials: Partial<Record<ItemType, number>>
}

export interface ActiveEntityState {
  type: EntityStateType.Active
}

export type EntityState = BuildEntityState | ActiveEntityState

export interface BaseEntity {
  id: EntityId
  type: EntityType
  position: Vec2
  size: Vec2
  state: EntityState
}

export interface HouseEntity extends BaseEntity {
  type: EntityType.House
}

export interface TreeEntity extends BaseEntity {
  type: EntityType.Tree
}

export interface FarmCell {
  ticks: number
}

export interface FarmEntity extends BaseEntity {
  type: EntityType.Farm
  cells: FarmCell[]
}

export type Entity = HouseEntity | TreeEntity | FarmEntity

export type AgentId = string

export interface Agent {
  id: AgentId
  position: Vec2
  jobId?: JobId
  inventory: Partial<Record<ItemType, number>>
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
  Build = 'build',
}

export type JobId = string

export interface BaseJob {
  id: JobId
}

export interface CutTreesJob extends BaseJob {
  type: JobType.CutTrees
  entityIds: EntityId[]
}

export interface BuildJob extends BaseJob {
  type: JobType.Build
  entityId: EntityId
}

export type Job = CutTreesJob | BuildJob

export interface World {
  chunks: Record<ChunkId, Chunk>
  entities: Record<EntityId, Entity>
  agents: Record<AgentId, Agent>
  jobs: Record<JobId, Job>
}
