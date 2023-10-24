import invariant from 'tiny-invariant'
import { move } from './tick-util.js'
import { DropOffItemsJob, EntityType, ItemType, TickJobFn } from './types.js'

export const tickDropOffItemsJob: TickJobFn<DropOffItemsJob> = ({
  agent,
  job,
  updates,
  world,
}) => {
  const storage = world.entities[job.entityId]
  invariant(storage?.type === EntityType.Storage)

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
  }

  agent.inventory = {}
  delete agent.jobId
  delete world.jobs[job.id]

  updates.entityIds.add(storage.id)
  updates.jobIds.add(job.id)
}
