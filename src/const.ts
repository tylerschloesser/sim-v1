import invariant from 'tiny-invariant'
import { Vec2 } from './vec2.js'
import { EntityType, ItemType } from './types.js'

export const INITIAL_ZOOM = 0.2
export const MIN_ZOOM = 0
export const MAX_ZOOM = 1

export const MAX_CELL_SIZE = 64
export const MIN_CELL_SIZE = 4

export const CHUNK_SIZE = 32

export const WHEEL_SCALE = 2000

export const TREE_SIZE = new Vec2(1)
export const FARM_SIZE = new Vec2(4)
export const HOUSE_SIZE = new Vec2(2)
export const STORAGE_SIZE = new Vec2(8, 4)
export const WELL_SIZE = new Vec2(2)
export const STOCKPILE_SIZE = new Vec2(8, 4)

export const ENTITY_TYPE_TO_SIZE: Record<EntityType, Vec2> = {
  [EntityType.Tree]: TREE_SIZE,
  [EntityType.Farm]: FARM_SIZE,
  [EntityType.House]: HOUSE_SIZE,
  [EntityType.Storage]: STORAGE_SIZE,
  [EntityType.Well]: WELL_SIZE,
  [EntityType.Stockpile]: STOCKPILE_SIZE,
}

// how much area around the starting point [0,0] is clear from water and trees
export const INITIAL_CLEAR_RADIUS = CHUNK_SIZE / 2

export const STORAGE_CAPACITY: number =
  (STORAGE_SIZE.x * 2 - 1) * STORAGE_SIZE.y
invariant(STORAGE_CAPACITY % STORAGE_SIZE.y === 0)

// How much fatigue is gained (per tick)
export const AGENT_FATIGUE_PER_TICK = 1 / 200

// How much fatigue does the agent lose while resting (per tick)
export const AGENT_FATIGUE_REPLENISH_PER_TICK = 1 / 20

// How much hunger does the agent gain (per tick)
export const AGENT_HUNGER_PER_TICK = 1 / 1000

// How many ticks before maturity
export const FARM_GROW_RATE = 200

// How many ticks does water last?
export const FARM_WATER_CONSUMPTION_RATE = 600

// how much faster do things grow with water
export const FARM_WATER_FACTOR: number = 4
invariant(FARM_WATER_FACTOR !== 0)

// when is a cell considered mature
export const FARM_MATURITY_THRESHOLD: number = 1
invariant(FARM_MATURITY_THRESHOLD > 0)

// when is a cell considered dead
export const FARM_DEAD_THRESHOLD: number = 2
invariant(FARM_DEAD_THRESHOLD > FARM_MATURITY_THRESHOLD)

export const ENTITY_MATERIALS: Record<
  EntityType,
  Partial<Record<ItemType, number>>
> = {
  [EntityType.Farm]: {
    [ItemType.Wood]: 8,
  },
  [EntityType.House]: {
    [ItemType.Wood]: 2,
  },
  [EntityType.Storage]: {
    [ItemType.Wood]: 20,
  },
  [EntityType.Well]: {
    [ItemType.Wood]: 4,
  },
  [EntityType.Tree]: {},
  [EntityType.Stockpile]: {},
}
