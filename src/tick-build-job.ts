import invariant from 'tiny-invariant'
import { move } from './tick-util.js'
import {
  BuildJob,
  BuildJobState,
  EntityStateType,
  EntityType,
  ItemType,
  StockpileEntity,
  TickJobFn,
} from './types.js'
import { ENTITY_MATERIALS } from './const.js'

export const tickBuildJob: TickJobFn<BuildJob> = ({
  world,
  updates,
  job,
  agent,
}) => {
  const entity = world.entities[job.entityId]
  invariant(entity)
  invariant(entity.state.type === EntityStateType.Build)

  switch (job.state) {
    case BuildJobState.PickUpMaterials: {
      let missing: { itemType: ItemType; count: number } | null = null
      const required = ENTITY_MATERIALS[entity.type]

      for (const [itemType, count] of Object.entries(required) as [
        ItemType,
        number,
      ][]) {
        let has = entity.state.materials[itemType] ?? 0
        if (agent.inventory?.itemType === itemType) {
          has += agent.inventory.count
        }

        invariant(has <= count)
        if (has < count) {
          missing = {
            itemType,
            count: count - has,
          }
          break
        }
      }

      invariant(missing)
      invariant(missing.count > 0)

      let target: StockpileEntity | null = null

      for (const stockpile of Object.values(world.entities).filter(
        (entity): entity is StockpileEntity =>
          entity.type === EntityType.Stockpile,
      )) {
        if (stockpile.inventory.includes(missing.itemType)) {
          target = stockpile
          break
        }
      }

      invariant(target)

      const { arrived } = move(agent, target.position)
      updates.agentIds.add(agent.id)

      if (!arrived) {
        return
      }

      invariant(
        agent.inventory === null ||
          agent.inventory.itemType === missing.itemType,
      )
      if (agent.inventory === null) {
        agent.inventory = { itemType: missing.itemType, count: 0 }
      }

      invariant(agent.inventory.itemType)

      const index = target.inventory.findIndex((v) => v === missing!.itemType)
      invariant(index >= 0)
      target.inventory.splice(index, 1)
      updates.entityIds.add(target.id)

      agent.inventory.count += 1

      if (missing.count === 1) {
        // TODO this won't work with multiple materials

        job.state = BuildJobState.DropOffMaterials
        updates.jobIds.add(job.id)
      }

      break
    }
    case BuildJobState.DropOffMaterials: {
      const { arrived } = move(agent, entity.position)
      updates.agentIds.add(agent.id)

      if (!arrived) {
        return
      }

      let complete = true
      const required = ENTITY_MATERIALS[entity.type]
      for (const itemType of Object.keys(
        entity.state.materials,
      ) as ItemType[]) {
        invariant(required[itemType]!)
        if (entity.state.materials[itemType]! < required[itemType]!) {
          invariant(agent.inventory?.itemType === itemType)
          entity.state.materials[itemType]! += 1
          agent.inventory.count -= 1
          if (agent.inventory.count === 0) {
            agent.inventory = null
          }
          complete = false
          break
        }
      }

      updates.entityIds.add(entity.id)

      if (complete) {
        job.state = BuildJobState.Build
        updates.jobIds.add(job.id)
      }

      break
    }
    case BuildJobState.Build: {
      entity.state = { type: EntityStateType.Active }
      updates.entityIds.add(entity.id)

      delete world.jobs[job.id]
      delete agent.jobId
      updates.jobIds.add(job.id)
      break
    }
  }
}
