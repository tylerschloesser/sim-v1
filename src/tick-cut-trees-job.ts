import invariant from 'tiny-invariant'
import { CutTreesJob, ItemType, TickJobFn } from './types.js'
import { getCell, getChunkId } from './util.js'
import { Vec2 } from './vec2.js'

export const tickCutTreesJob: TickJobFn<CutTreesJob> = ({
  world,
  updates,
  job,
  agent,
}) => {
  const entityId = job.entityIds.at(0)
  invariant(entityId)

  const entity = world.entities[entityId]
  invariant(entity)

  if (Vec2.isEqual(entity.position, agent.position)) {
    delete world.entities[entity.id]
    updates.entityIds.add(entity.id)

    invariant(entity.size.x === 1)
    invariant(entity.size.y === 1)

    for (let y = 0; y < entity.size.y; y++) {
      for (let x = 0; x < entity.size.x; x++) {
        const cellPosition = entity.position.add(new Vec2(x, y))
        const cell = getCell(world.chunks, cellPosition)
        delete cell.entityId

        const chunkId = getChunkId(cellPosition)
        updates.chunkIds.add(chunkId)
      }
    }

    job.entityIds.shift()
    if (job.entityIds.length === 0) {
      delete world.jobs[job.id]
      updates.jobIds.add(job.id)

      delete agent.jobId
      updates.agentIds.add(agent.id)
    }

    agent.inventory = {
      ...agent.inventory,
      [ItemType.Wood]: (agent.inventory.wood ?? 0) + 1,
    }

    updates.agentIds.add(agent.id)
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
