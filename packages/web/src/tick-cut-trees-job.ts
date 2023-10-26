import invariant from 'tiny-invariant'
import { move } from './tick-util.js'
import { CutTreesJob, ItemType, TickJobFn } from './types.js'
import { getCell, getChunkId } from './util.js'
import { Vec2 } from './vec2.js'

export const tickCutTreesJob: TickJobFn<CutTreesJob> = ({
  world,
  updates,
  job,
  agent,
  info,
}) => {
  const entityId = job.entityIds.at(0)
  invariant(entityId)

  const entity = world.entities[entityId]
  invariant(entity)

  invariant(
    agent.inventory === null || agent.inventory.itemType === ItemType.Wood,
  )
  invariant((agent.inventory?.count ?? 0) <= info.availableStockpileCapacity)

  if ((agent.inventory?.count ?? 0) === info.availableStockpileCapacity) {
    delete agent.jobId
    updates.agentIds.add(agent.id)
    return
  }

  const { arrived } = move(agent, entity.position)
  updates.agentIds.add(agent.id)

  if (!arrived) {
    return
  }

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

  if (agent.inventory === null) {
    agent.inventory = { itemType: ItemType.Wood, count: 0 }
  }

  invariant(agent.inventory.itemType === ItemType.Wood)
  agent.inventory.count += 1
}
