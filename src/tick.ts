import invariant from 'tiny-invariant'
import { AGENT_ENERGY_PER_TICK } from './const.js'
import { agents$, chunks$, entities$, jobs$ } from './state.js'
import { tickAgentRestJob } from './tick-agent-rest.js'
import { tickBuildJob } from './tick-build-job.js'
import { tickCutTreesJob } from './tick-cut-trees-job.js'
import { tickFarm, tickPickGardenJob } from './tick-farm.js'
import {
  AgentRestJob,
  DropOffItemsJob,
  EntityStateType,
  EntityType,
  ItemType,
  JobType,
  StorageEntity,
  World,
  WorldUpdates,
} from './types.js'
import { getNextJobId } from './util.js'
import { tickDropOffItemsJob } from './tick-drop-off-items-job.js'
import { tickWaterGardenJob } from './tick-water-garden-job.js'

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
    agent.energy = Math.max(agent.energy - AGENT_ENERGY_PER_TICK, 0)

    if (agent.energy === 0) {
      updates.agentIds.add(agent.id)

      let job: AgentRestJob | undefined
      if (agent.jobId) {
        const temp = world.jobs[agent.jobId]
        invariant(temp)
        if (temp.type === JobType.AgentRest) {
          job = temp
        }
      }

      if (!job && agent.home) {
        job = {
          id: getNextJobId(),
          type: JobType.AgentRest,
        }
        world.jobs[job.id] = job

        if (agent.jobId) {
          // agent no longer assigned to this job
          updates.jobIds.add(agent.jobId)
        }

        agent.jobId = job.id
        updates.jobIds.add(job.id)
      }
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
          case JobType.WaterGarden: {
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

    if (!agent.jobId && Object.keys(agent.inventory).length > 0) {
      // TODO pick the closest
      const storage = Object.values(world.entities).find(
        (entity): entity is StorageEntity => entity.type === EntityType.Storage,
      )

      if (storage) {
        const job: DropOffItemsJob = {
          id: getNextJobId(),
          type: JobType.DropOffItems,
          entityId: storage.id,
        }
        agent.jobId = job.id
        world.jobs[job.id] = job
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
      case JobType.DropOffItems:
        tickDropOffItemsJob({ world, updates, job, agent })
        break
      case JobType.WaterGarden:
        tickWaterGardenJob({ world, updates, job, agent })
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
