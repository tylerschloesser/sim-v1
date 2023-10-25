import invariant from 'tiny-invariant'
import { FARM_MATURITY_THRESHOLD, FARM_SIZE } from './const.js'
import { move } from './tick-util.js'
import { EntityType, ItemType, PickGardenJob, TickJobFn } from './types.js'
import { Vec2 } from './vec2.js'

export const tickPickGardenJob: TickJobFn<PickGardenJob> = ({
  world,
  updates,
  job,
  agent,
}) => {
  // get the first
  const [cellIndex] = job.cellIndexes
  invariant(typeof cellIndex === 'number')

  const farm = world.entities[job.entityId]
  invariant(farm?.type === EntityType.Farm)

  const cell = farm.cells[cellIndex]
  invariant(cell)

  const cellPosition = farm.position.add(
    new Vec2(cellIndex % FARM_SIZE.x, Math.floor(cellIndex / FARM_SIZE.y)),
  )

  const { arrived } = move(agent, cellPosition)
  updates.agentIds.add(agent.id)

  if (!arrived) {
    return
  }

  invariant(cell.maturity >= FARM_MATURITY_THRESHOLD)

  if (agent.inventory === null) {
    agent.inventory = { itemType: ItemType.Food, count: 0 }
  }
  invariant(agent.inventory?.itemType === ItemType.Food)
  agent.inventory.count += 1

  cell.maturity = 0

  invariant(job.cellIndexes.size >= 1)
  job.cellIndexes.delete(cellIndex)

  if (job.cellIndexes.size === 0) {
    delete world.jobs[job.id]
    farm.pickJobId = null
    delete agent.jobId
  }

  updates.jobIds.add(job.id)
  updates.entityIds.add(job.entityId)
}
