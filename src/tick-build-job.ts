import invariant from 'tiny-invariant'
import { move } from './tick-util.js'
import { BuildJob, EntityStateType, ItemType, TickJobFn } from './types.js'

export const tickBuildJob: TickJobFn<BuildJob> = ({
  world,
  updates,
  job,
  agent,
}) => {
  const entity = world.entities[job.entityId]
  invariant(entity)
  invariant(entity.state.type === EntityStateType.Build)

  const { arrived } = move(agent, entity.position)
  updates.agentIds.add(agent.id)

  if (!arrived) {
    return
  }

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
  updates.entityIds.add(entity.id)
}
