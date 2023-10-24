import invariant from 'tiny-invariant'
import { Vec2 } from './vec2.js'

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

export const STORAGE_CAPACITY: number =
  (STORAGE_SIZE.x * 2 - 1) * STORAGE_SIZE.y
invariant(STORAGE_CAPACITY % STORAGE_SIZE.y === 0)

// How much energy is consumed per tick
export const AGENT_ENERGY_PER_TICK = 1 / 200

// How much energy does the agent gain while resting per tick
export const AGENT_ENERGY_REPLENISH_PER_TICK = 1 / 20

// How many ticks before maturity
export const FARM_GROW_RATE = 50

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
