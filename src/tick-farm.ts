import invariant from 'tiny-invariant'
import {
  FARM_DEAD_THRESHOLD,
  FARM_GROW_RATE,
  FARM_MATURITY_THRESHOLD,
  FARM_SIZE,
  FARM_WATER_FACTOR,
} from './const.js'
import { move } from './tick-util.js'
import {
  EntityType,
  FarmEntity,
  ItemType,
  JobType,
  PickGardenJob,
  TickJobFn,
  WaterGardenJob,
  World,
  WorldUpdates,
} from './types.js'
import { getNextJobId } from './util.js'
import { Vec2 } from './vec2.js'

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

    if (cell.maturity < FARM_MATURITY_THRESHOLD && cell.water === 0) {
      let job: WaterGardenJob
      if (farm.waterJobId) {
        // const temp = jobs
      }
    } else if (
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
          cellIndexes: [],
          entityId: farm.id,
          id: getNextJobId(),
        }
        farm.pickJobId = job.id
        world.jobs[job.id] = job
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

export const tickPickGardenJob: TickJobFn<PickGardenJob> = ({
  world,
  updates,
  job,
  agent,
}) => {
  const cellIndex = job.cellIndexes[0]
  invariant(typeof cellIndex === 'number')

  const farm = world.entities[job.entityId]
  invariant(farm?.type === EntityType.Farm)

  const cell = farm.cells[cellIndex]
  invariant(cell)

  const cellPosition = farm.position.add(
    new Vec2(cellIndex % FARM_SIZE.x, Math.floor(cellIndex / FARM_SIZE.y)),
  )

  const { arrived } = move(agent, cellPosition)
  updates.agentIds.add(agent.id)

  if (!arrived) {
    return
  }

  invariant(cell.maturity >= FARM_MATURITY_THRESHOLD)
  if (cell.maturity < FARM_DEAD_THRESHOLD) {
    agent.inventory[ItemType.Food] = (agent.inventory[ItemType.Food] ?? 0) + 1
  } else {
    agent.inventory[ItemType.Trash] = (agent.inventory[ItemType.Trash] ?? 0) + 1
  }

  cell.maturity = 0

  invariant(job.cellIndexes.length >= 1)
  job.cellIndexes.shift()

  if (job.cellIndexes.length === 0) {
    delete world.jobs[job.id]
    farm.pickJobId = null
    delete agent.jobId
  }

  updates.jobIds.add(job.id)
  updates.entityIds.add(job.entityId)
}
