import invariant from 'tiny-invariant'
import { BuildJob, EntityStateType, ItemType, TickJobFn } from './types.js'
import { Vec2 } from './vec2.js'

export const tickBuildJob: TickJobFn<BuildJob> = ({
  world,
  updates,
  job,
  agent,
}) => {
  const entity = world.entities[job.entityId]
  invariant(entity)
  invariant(entity.state.type === EntityStateType.Build)

  if (Vec2.isEqual(entity.position, agent.position)) {
    Object.entries(entity.state.materials).forEach((entry) => {
      const [itemType, count] = entry as [ItemType, number]
      invariant((agent.inventory[itemType] ?? 0) >= count)
      agent.inventory[itemType]! -= count
      if (agent.inventory[itemType] === 0) {
        delete agent.inventory[itemType]
      }
    })
    world.entities[entity.id] = {
      ...entity,
      state: { type: EntityStateType.Active },
    }
    delete world.jobs[job.id]
    delete agent.jobId

    updates.jobIds.add(job.id)
    updates.agentIds.add(agent.id)
    updates.entityIds.add(entity.id)
  } else {
    const delta = entity.position.sub(agent.position)
    const speed = 1

    if (delta.dist() <= speed) {
      agent.position = entity.position
    } else {
      const velocity = delta.norm().mul(speed)
      agent.position = agent.position.add(velocity)
    }

    updates.agentIds.add(agent.id)
  }
}
