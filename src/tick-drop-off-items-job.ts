import invariant from 'tiny-invariant'
import { move } from './tick-util.js'
import { DropOffItemsJob, EntityType, ItemType, TickJobFn } from './types.js'
import { STORAGE_CAPACITY } from './const.js'

export const tickDropOffItemsJob: TickJobFn<DropOffItemsJob> = ({
  agent,
  job,
  updates,
  world,
}) => {
  const storage = world.entities[job.entityId]
  invariant(storage?.type === EntityType.Storage)

  invariant(storage.inventory.length < STORAGE_CAPACITY)

  const { arrived } = move(agent, storage.position)
  updates.agentIds.add(agent.id)

  if (!arrived) {
    return
  }

  invariant(agent.inventory)
  invariant(agent.inventory.count > 0)

  storage.inventory.push(agent.inventory.itemType)

  agent.inventory.count -= 1
  if (agent.inventory.count === 0) {
    agent.inventory = null
  }

  if (
    agent.inventory === null ||
    storage.inventory.length === STORAGE_CAPACITY
  ) {
    delete agent.jobId
    delete world.jobs[job.id]
    updates.jobIds.add(job.id)
  }

  updates.entityIds.add(storage.id)
}
