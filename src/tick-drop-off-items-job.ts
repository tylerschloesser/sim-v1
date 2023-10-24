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

  invariant(Object.keys(agent.inventory).length > 0)

  for (const entry of Object.entries(agent.inventory)) {
    const [itemType, count] = entry as [ItemType, number]

    invariant(count > 0)
    storage.inventory.push(itemType)

    if (count === 1) {
      delete agent.inventory[itemType]
    } else {
      agent.inventory[itemType] = count - 1
    }
  }

  if (
    Object.keys(agent.inventory).length === 0 ||
    storage.inventory.length === STORAGE_CAPACITY
  ) {
    delete agent.jobId
    delete world.jobs[job.id]
    updates.jobIds.add(job.id)
  }

  updates.entityIds.add(storage.id)
}
