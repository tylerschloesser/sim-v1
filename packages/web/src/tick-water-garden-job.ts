import invariant from 'tiny-invariant'
import { move } from './tick-util.js'
import {
  EntityType,
  ItemType,
  TickJobFn,
  WaterGardenJob,
  WaterGardenJobState,
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
  switch (job.state) {
    case WaterGardenJobState.PickUpWaterBucket: {
      invariant(agent.inventory === null)

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

      agent.inventory = { itemType: ItemType.WaterBucket, count: 1 }
      updates.agentIds.add(agent.id)

      job.state = WaterGardenJobState.WaterGarden
      updates.jobIds.add(job.id)

      break
    }
    case WaterGardenJobState.WaterGarden: {
      invariant(
        agent.inventory?.itemType === ItemType.WaterBucket &&
          agent.inventory.count === 1,
      )

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
      updates.jobIds.add(job.id)

      if (job.cellIndexes.size === 0) {
        // delete world.jobs[job.id]
        // farm.waterJobId = null
        // delete agent.jobId

        job.state = WaterGardenJobState.DropOffWaterBucket
        updates.agentIds.add(agent.id)
      }
      break
    }
    case WaterGardenJobState.DropOffWaterBucket: {
      invariant(
        agent.inventory?.itemType === ItemType.WaterBucket &&
          agent.inventory.count === 1,
      )

      let well: WellEntity | undefined
      for (const entity of Object.values(world.entities)) {
        // TODO choose closest
        if (entity.type === EntityType.Well) {
          well = entity
          break
        }
      }

      invariant(well)

      const { arrived } = move(agent, well.position)
      updates.agentIds.add(agent.id)

      if (!arrived) {
        return
      }

      agent.inventory = null

      delete world.jobs[job.id]
      updates.jobIds.add(job.id)

      const farm = world.entities[job.entityId]
      invariant(farm?.type === EntityType.Farm)

      farm.waterJobId = null
      updates.entityIds.add(farm.id)

      delete agent.jobId
      updates.agentIds.add(agent.id)

      break
    }
  }
}
