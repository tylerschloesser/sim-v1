import invariant from 'tiny-invariant'
import { Vec2 } from './vec2.js'

export const INITIAL_ZOOM = 0.2
export const MIN_ZOOM = 0
export const MAX_ZOOM = 1

export const MAX_CELL_SIZE = 64
export const MIN_CELL_SIZE = 4

export const CHUNK_SIZE = 32

export const WHEEL_SCALE = 2000

export const FARM_SIZE = new Vec2(4)

// How much energy is consumed per tick
export const AGENT_ENERGY_PER_TICK = 1 / 50

// How much energy does the agent gain while resting per tick
export const AGENT_ENERGY_REPLENISH_PER_TICK = 1 / 20

// How many ticks before maturity
export const FARM_GROW_RATE = 50

// how much faster do things grow with water
export const FARM_WATER_FACTOR: number = 1
invariant(FARM_WATER_FACTOR !== 0)
