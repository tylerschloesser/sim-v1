import invariant from 'tiny-invariant'
import { DropOffItemsJob, EntityType, ItemType, TickJobFn } from './types.js'
import { Vec2 } from './vec2.js'

export const tickDropOffItemsJob: TickJobFn<DropOffItemsJob> = ({
  agent,
  job,
  updates,
  world,
}) => {
  const storage = world.entities[job.entityId]
  invariant(storage?.type === EntityType.Storage)

  if (Vec2.isEqual(storage.position, agent.position)) {
    invariant(Object.keys(agent.inventory).length > 0)

    for (const entry of Object.entries(agent.inventory)) {
      const [itemType, count] = entry as [ItemType, number]
      invariant(count > 0)
      storage.inventory[itemType] = (storage.inventory[itemType] ?? 0) + count
    }

    agent.inventory = {}
    delete agent.jobId
    delete world.jobs[job.id]

    updates.entityIds.add(storage.id)
    updates.jobIds.add(job.id)
  } else {
    const delta = storage.position.sub(agent.position)
    const speed = 1

    if (delta.dist() <= speed) {
      agent.position = storage.position
    } else {
      const velocity = delta.norm().mul(speed)
      agent.position = agent.position.add(velocity)
    }
  }

  updates.agentIds.add(agent.id)
}
