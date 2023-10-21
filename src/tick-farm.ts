import invariant from 'tiny-invariant'
import { jobs$ } from './state.js'
import {
  Agent,
  EntityType,
  FarmEntity,
  ItemType,
  JobType,
  PickGardenJob,
  World,
  WorldUpdates,
} from './types.js'
import { getNextJobId } from './util.js'
import { FARM_SIZE } from './const.js'
import { Vec2 } from './vec2.js'

// how many ticks before maturity
const GROW_RATE = 5 * 10

// how much faster do things grow with water
const WATER_FACTOR: number = 1

invariant(WATER_FACTOR !== 0)

export function tickFarm(
  world: World,
  updates: WorldUpdates,
  farm: FarmEntity,
): void {
  for (let i = 0; i < farm.cells.length; i++) {
    const cell = farm.cells[i]
    invariant(cell)

    const lastMaturity = cell.maturity
    cell.maturity += (1 / GROW_RATE) * (cell.water ? 1 : 1 / WATER_FACTOR)

    if (lastMaturity < 1 && cell.maturity >= 1) {
      let job: PickGardenJob
      if (farm.pickJobId) {
        const temp = jobs$.value[farm.pickJobId]
        invariant(temp?.type === JobType.PickGarden)
        job = temp
      } else {
        job = {
          type: JobType.PickGarden,
          cellIndexes: [],
          entityId: farm.id,
          id: getNextJobId(),
        }
        farm.pickJobId = job.id
        jobs$.value[job.id] = job
      }

      job.cellIndexes.push(i)

      updates.jobIds.add(job.id)
    }

    if (cell.water > 0) {
      cell.water = Math.max(cell.water - 1 / (60 * 10), 0)
    }
  }

  world.entities[farm.id] = { ...farm }

  // TODO only update when needed?
  updates.entityIds.add(farm.id)
}

export function tickPickGardenJob({
  world,
  updates,
  job,
  agent,
}: {
  world: World
  updates: WorldUpdates
  job: PickGardenJob
  agent: Agent
}): void {
  const cellIndex = job.cellIndexes[0]
  invariant(typeof cellIndex === 'number')

  const farm = world.entities[job.entityId]
  invariant(farm?.type === EntityType.Farm)

  const cell = farm.cells[cellIndex]
  invariant(cell)

  const cellPosition = farm.position.add(
    new Vec2(cellIndex % FARM_SIZE.x, Math.floor(cellIndex / FARM_SIZE.y)),
  )

  if (!Vec2.isEqual(agent.position, cellPosition)) {
    const delta = cellPosition.sub(agent.position)
    const speed = 1

    if (delta.dist() <= speed) {
      agent.position = cellPosition
    } else {
      const velocity = delta.norm().mul(speed)
      agent.position = agent.position.add(velocity)
    }

    updates.agentIds.add(agent.id)
  } else {
    cell.maturity = 0

    agent.inventory[ItemType.Food] = (agent.inventory[ItemType.Food] ?? 0) + 1

    invariant(job.cellIndexes.length >= 1)
    job.cellIndexes.shift()

    if (job.cellIndexes.length === 0) {
      delete world.jobs[job.id]
      farm.pickJobId = null
      delete agent.jobId
    }
  }

  updates.agentIds.add(agent.id)
  updates.jobIds.add(job.id)
}
