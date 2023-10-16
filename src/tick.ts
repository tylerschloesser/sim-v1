import invariant from 'tiny-invariant'
import { agents$, chunks$, entities$, jobs$ } from './state.js'
import { Vec2 } from './vec2.js'
import { getCell, getChunkId } from './util.js'
import {
  Agent,
  AgentId,
  BuildJob,
  ChunkId,
  CutTreesJob,
  EntityId,
  JobId,
  JobType,
  World,
} from './types.js'

interface WorldUpdates {
  entityIds: Set<EntityId>
  agentIds: Set<AgentId>
  jobIds: Set<JobId>
  chunkIds: Set<ChunkId>
}

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
}) {}

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
    }
    delete agent.jobId
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

  for (const agent of Object.values(world.agents)) {
    if (!agent.jobId) {
      if (Object.values(world.jobs).length > 0) {
        const job = Object.values(world.jobs).at(0)
        invariant(job)
        agent.jobId = job.id
        updates.agentIds.add(agent.id)
      }
    }

    if (!agent.jobId) {
      return
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
    }

    if (updates.agentIds.size > 0) {
      agents$.next({ ...world.agents })
    }
    if (updates.chunkIds.size > 0) {
      chunks$.next({ ...world.chunks })
    }
    if (updates.entityIds.size > 0) {
      entities$.next({ ...world.entities })
    }
    if (updates.jobIds.size > 0) {
      jobs$.next({ ...world.jobs })
    }
  }
}
