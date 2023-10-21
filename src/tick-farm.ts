import invariant from 'tiny-invariant'
import { jobs$ } from './state.js'
import {
  Agent,
  FarmEntity,
  JobType,
  PickGardenJob,
  World,
  WorldUpdates,
} from './types.js'
import { getNextJobId } from './util.js'

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
      }

      job.cellIndexes.push(i)
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
}
