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

  invariant(
    Object.keys(entity.state.materials).length === 1,
    'TODO support multiple build materials',
  )

  const [itemType, count] = Object.entries(entity.state.materials)[0] as [
    ItemType,
    number,
  ]

  invariant(agent.inventory?.itemType === itemType)
  invariant(agent.inventory.count >= count)

  agent.inventory.count -= count
  if (agent.inventory.count === 0) {
    agent.inventory = null
  }

  entity.state = {
    type: EntityStateType.Active,
  }

  delete world.jobs[job.id]
  delete agent.jobId

  updates.jobIds.add(job.id)
  updates.entityIds.add(entity.id)
}
