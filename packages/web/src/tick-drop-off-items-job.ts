import invariant from 'tiny-invariant'
import { STOCKPILE_CAPACITY, STORAGE_CAPACITY } from './const.js'
import { move } from './tick-util.js'
import { DropOffItemsJob, EntityType, ItemType, TickJobFn } from './types.js'

export const tickDropOffItemsJob: TickJobFn<DropOffItemsJob> = ({
  agent,
  job,
  updates,
  world,
}) => {
  const entity = world.entities[job.entityId]
  invariant(
    entity?.type === EntityType.Storage ||
      entity?.type === EntityType.Stockpile,
  )

  if (entity.type === EntityType.Storage) {
    invariant(entity.inventory.length < STORAGE_CAPACITY)
    invariant(agent.inventory?.itemType === ItemType.Food)
  } else {
    invariant(entity.type === EntityType.Stockpile)
    invariant(entity.inventory.length < STOCKPILE_CAPACITY)
    invariant(agent.inventory?.itemType === ItemType.Wood)
  }

  const { arrived } = move(agent, entity.position)
  updates.agentIds.add(agent.id)

  if (!arrived) {
    return
  }

  invariant(agent.inventory.count > 0)

  entity.inventory.push(agent.inventory.itemType)

  agent.inventory.count -= 1
  if (agent.inventory.count === 0) {
    agent.inventory = null
  }

  if (
    agent.inventory === null ||
    entity.inventory.length === STORAGE_CAPACITY
  ) {
    delete agent.jobId
    delete world.jobs[job.id]
    updates.jobIds.add(job.id)
  }

  updates.entityIds.add(entity.id)
}
