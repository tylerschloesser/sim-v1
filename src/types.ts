import { Texture } from 'pixi.js'
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
  Storage = 'storage',
  Well = 'well',
  Stockpile = 'stockpile',
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
  Food = 'food',
  Trash = 'trash',
  WaterBucket = 'water-bucket',
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
  chunkIds: Set<ChunkId>
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
  water: number
  maturity: number
}

export interface FarmEntity extends BaseEntity {
  type: EntityType.Farm
  cells: FarmCell[]
  pickJobId: JobId | null
  waterJobId: JobId | null
}

export interface StorageEntity extends BaseEntity {
  type: EntityType.Storage
  inventory: ItemType[]
}

export interface WellEntity extends BaseEntity {
  type: EntityType.Well
}

export interface StockpileEntity extends BaseEntity {
  type: EntityType.Stockpile
  inventory: ItemType[]
}

export type Entity =
  | HouseEntity
  | TreeEntity
  | FarmEntity
  | StorageEntity
  | WellEntity
  | StockpileEntity

export type AgentId = string

export interface Agent {
  id: AgentId
  position: Vec2
  jobId?: JobId
  inventory: {
    itemType: ItemType
    count: number
  } | null
  fatigue: number
  hunger: number
  home: EntityId | null
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
  PickGarden = 'pick-garden',
  WaterGarden = 'water-garden',
  AgentRest = 'agent-rest',
  DropOffItems = 'drop-off-items',
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

export interface PickGardenJob extends BaseJob {
  type: JobType.PickGarden
  entityId: EntityId
  cellIndexes: Set<number>
}

export interface AgentRestJob extends BaseJob {
  type: JobType.AgentRest
}

export interface DropOffItemsJob extends BaseJob {
  type: JobType.DropOffItems
  entityId: EntityId
}

export enum WaterGardenJobState {
  PickUpWaterBucket = 'pick-up-water-bucket',
  WaterGarden = 'water-garden',
  DropOffWaterBucket = 'drop-off-water-bucket',
}

export interface WaterGardenJob extends BaseJob {
  type: JobType.WaterGarden
  entityId: EntityId
  cellIndexes: Set<number>
  state: WaterGardenJobState
}

export type Job =
  | CutTreesJob
  | BuildJob
  | PickGardenJob
  | AgentRestJob
  | DropOffItemsJob
  | WaterGardenJob

export interface World {
  chunks: Record<ChunkId, Chunk>
  entities: Record<EntityId, Entity>
  agents: Record<AgentId, Agent>
  jobs: Record<JobId, Job>
}

export enum ZoomLevel {
  Low = 'low',
  High = 'high',
}

export enum TextureType {
  Tree = 'tree',
  House = 'house',
  Agent = 'agent',
  Storage = 'storage',
  Well = 'well',
  Stockpile = 'stockpile',

  AgentFatigueHigh = 'agent-fatigue-high',
  AgentFatigueMedium = 'agent-fatigue-medium',
  AgentFatigueLow = 'agent-fatigue-low',

  AgentHungerHigh = 'agent-hunger-high',
  AgentHungerMedium = 'agent-hunger-medium',
  AgentHungerLow = 'agent-hunger-low',

  FarmBase = 'farm-base',
  FarmCell1 = 'farm-cell-1',
  FarmCell2 = 'farm-cell-2',
  FarmCell3 = 'farm-cell-3',
  FarmCell4 = 'farm-cell-4',
  FarmCell5 = 'farm-cell-5',
  FarmCellWater = 'farm-cell-water',

  ItemWood = 'item-tree',
  ItemFood = 'item-food',
  ItemTrash = 'item-trash',
}

export type Textures = Record<TextureType, Texture>

export interface WorldUpdates {
  entityIds: Set<EntityId>
  agentIds: Set<AgentId>
  jobIds: Set<JobId>
  chunkIds: Set<ChunkId>
}

export interface TickJobArgs<T> {
  world: World
  updates: WorldUpdates
  job: T
  agent: Agent
  info: {
    availableStorageCapacity: number
  }
}

export type TickJobFn<T extends Job> = (args: TickJobArgs<T>) => void
