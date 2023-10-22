import invariant from 'tiny-invariant'
import { agents$, chunks$, entities$, jobs$ } from './state.js'
import { tickFarm, tickPickGardenJob } from './tick-farm.js'
import {
  Agent,
  AgentRestJob,
  BuildJob,
  CutTreesJob,
  EntityStateType,
  EntityType,
  ItemType,
  JobType,
  World,
  WorldUpdates,
} from './types.js'
import { getCell, getChunkId, getNextJobId } from './util.js'
import { Vec2 } from './vec2.js'
import { tickAgentRestJob } from './tick-agent-rest.js'

// how many ticks until agent energy depleted?
const ENERGY_FACTOR = 50

function tickBuildJob({
  world,
  updates,
  job,
  agent,
}: {
  world: World
  updates: WorldUpdates
  job: BuildJob
  agent: Agent
}) {
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

function tickCutTreesJob({
  world,
  updates,
  job,
  agent,
}: {
  world: World
  updates: WorldUpdates
  job: CutTreesJob
  agent: Agent
}) {
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

function tickEntities(world: World, updates: WorldUpdates): void {
  for (const entity of Object.values(world.entities)) {
    if (entity.state.type !== EntityStateType.Active) {
      continue
    }
    switch (entity.type) {
      case EntityType.Farm:
        tickFarm(world, updates, entity)
        break
    }
  }
}

function tickAgents(world: World, updates: WorldUpdates): void {
  for (const agent of Object.values(world.agents)) {
    agent.energy = Math.max(agent.energy - 1 / ENERGY_FACTOR, 0)

    if (agent.energy === 0) {
      let job: AgentRestJob | undefined
      if (agent.jobId) {
        const temp = world.jobs[agent.jobId]
        invariant(temp)
        if (temp.type === JobType.AgentRest) {
          job = temp
        }
      }
      if (!job) {
        job = {
          id: getNextJobId(),
          type: JobType.AgentRest,
        }
        world.jobs[job.id] = job
        agent.jobId = job.id
      }
      invariant(job)
    }

    if (!agent.jobId) {
      for (const job of Object.values(world.jobs)) {
        switch (job.type) {
          case JobType.CutTrees: {
            agent.jobId = job.id
            updates.agentIds.add(agent.id)
            break
          }
          case JobType.Build: {
            const entity = world.entities[job.entityId]
            invariant(entity)
            invariant(entity.state.type === EntityStateType.Build)

            if (
              Object.entries(entity.state.materials).every(
                ([itemType, count]) =>
                  (agent.inventory[itemType as ItemType] ?? 0) >= count,
              )
            ) {
              agent.jobId = job.id
              updates.agentIds.add(agent.id)
            }
            break
          }
          case JobType.PickGarden: {
            agent.jobId = job.id
            updates.agentIds.add(agent.id)
            break
          }
        }

        if (agent.jobId) {
          break
        }
      }
    }

    if (!agent.jobId) {
      continue
    }

    const job = world.jobs[agent.jobId]
    invariant(job)

    switch (job.type) {
      case JobType.CutTrees:
        tickCutTreesJob({ world, updates, job, agent })
        break
      case JobType.Build:
        tickBuildJob({ world, updates, job, agent })
        break
      case JobType.PickGarden:
        tickPickGardenJob({ world, updates, job, agent })
        break
      case JobType.AgentRest:
        tickAgentRestJob({ world, updates, job, agent })
        break
    }
  }
}

export function tickWorld() {
  const world: World = {
    entities: entities$.value,
    agents: agents$.value,
    jobs: jobs$.value,
    chunks: chunks$.value,
  }

  const updates: WorldUpdates = {
    entityIds: new Set(),
    agentIds: new Set(),
    jobIds: new Set(),
    chunkIds: new Set(),
  }

  tickEntities(world, updates)
  tickAgents(world, updates)

  return updates
}
