import invariant from 'tiny-invariant'
import {
  FARM_GROW_RATE,
  FARM_MATURITY_THRESHOLD,
  FARM_WATER_CONSUMPTION_RATE,
  FARM_WATER_FACTOR,
} from './const.js'
import {
  FarmEntity,
  JobType,
  PickGardenJob,
  WaterGardenJob,
  WaterGardenJobState,
  World,
  WorldUpdates,
} from './types.js'
import { getNextJobId } from './util.js'

export function tickFarm(
  world: World,
  updates: WorldUpdates,
  farm: FarmEntity,
): void {
  for (let i = 0; i < farm.cells.length; i++) {
    const cell = farm.cells[i]
    invariant(cell)

    const lastMaturity = cell.maturity
    cell.maturity +=
      (1 / FARM_GROW_RATE) * (cell.water ? 1 : 1 / FARM_WATER_FACTOR)

    cell.water = Math.max(cell.water - 1 / FARM_WATER_CONSUMPTION_RATE, 0)

    if (cell.water === 0) {
      let job: WaterGardenJob
      if (farm.waterJobId) {
        const temp = world.jobs[farm.waterJobId]
        invariant(temp?.type === JobType.WaterGarden)
        job = temp
      } else {
        job = {
          type: JobType.WaterGarden,
          cellIndexes: new Set(),
          entityId: farm.id,
          id: getNextJobId(),
          state: WaterGardenJobState.PickUpWaterBucket,
        }
        farm.waterJobId = job.id
        world.jobs[job.id] = job
      }

      if (!job.cellIndexes.has(i)) {
        job.cellIndexes.add(i)
        updates.jobIds.add(job.id)
      }
    }

    if (
      lastMaturity < FARM_MATURITY_THRESHOLD &&
      cell.maturity >= FARM_MATURITY_THRESHOLD
    ) {
      let job: PickGardenJob
      if (farm.pickJobId) {
        const temp = world.jobs[farm.pickJobId]
        invariant(temp?.type === JobType.PickGarden)
        job = temp
      } else {
        job = {
          type: JobType.PickGarden,
          cellIndexes: new Set(),
          entityId: farm.id,
          id: getNextJobId(),
        }
        farm.pickJobId = job.id
        world.jobs[job.id] = job
      }

      invariant(!job.cellIndexes.has(i))
      job.cellIndexes.add(i)

      updates.jobIds.add(job.id)
    }
  }

  world.entities[farm.id] = { ...farm }

  // TODO only update when needed?
  updates.entityIds.add(farm.id)
}
