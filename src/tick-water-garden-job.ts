import invariant from 'tiny-invariant'
import { move } from './tick-util.js'
import {
  EntityType,
  ItemType,
  TickJobFn,
  WaterGardenJob,
  WellEntity,
} from './types.js'
import { Vec2 } from './vec2.js'
import { FARM_SIZE } from './const.js'

export const tickWaterGardenJob: TickJobFn<WaterGardenJob> = ({
  world,
  updates,
  job,
  agent,
}) => {
  if ((agent.inventory[ItemType.WaterBucket] ?? 0) === 0) {
    // go to well

    let well: WellEntity | undefined
    for (const entity of Object.values(world.entities)) {
      // TODO choose closest
      if (entity.type === EntityType.Well) {
        well = entity
        break
      }
    }

    if (!well) {
      // TODO notify
      return
    }

    const { arrived } = move(agent, well.position)
    updates.agentIds.add(agent.id)

    if (!arrived) {
      return
    }

    // TODO don't hardcode this
    agent.inventory[ItemType.WaterBucket] = 16
  } else {
    const [cellIndex] = job.cellIndexes
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

    invariant(cell.water === 0)
    cell.water = 1
    updates.entityIds.add(farm.id)

    job.cellIndexes.delete(cellIndex)
    if (job.cellIndexes.size === 0) {
      delete world.jobs[job.id]
      farm.waterJobId = null
      delete agent.jobId
      updates.agentIds.add(agent.id)
    }
    updates.jobIds.add(job.id)

    const count = agent.inventory[ItemType.WaterBucket]
    invariant(typeof count === 'number' && count > 0)
    if (count === 1) {
      delete agent.inventory[ItemType.WaterBucket]
    } else {
      agent.inventory[ItemType.WaterBucket] = count - 1
    }
  }
}
