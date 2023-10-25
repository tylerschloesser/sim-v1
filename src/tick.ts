import invariant from 'tiny-invariant'
import {
  AGENT_FATIGUE_PER_TICK,
  AGENT_HUNGER_PER_TICK,
  STOCKPILE_CAPACITY,
  STORAGE_CAPACITY,
} from './const.js'
import { agents$, chunks$, entities$, jobs$ } from './state.js'
import { tickAgentRestJob } from './tick-agent-rest.js'
import { tickBuildJob } from './tick-build-job.js'
import { tickCutTreesJob } from './tick-cut-trees-job.js'
import { tickDropOffItemsJob } from './tick-drop-off-items-job.js'
import { tickFarm } from './tick-farm.js'
import { tickPickGardenJob } from './tick-pick-garden.js'
import { tickWaterGardenJob } from './tick-water-garden-job.js'
import {
  AgentRestJob,
  DropOffItemsJob,
  EntityStateType,
  EntityType,
  ItemType,
  JobType,
  StorageEntity,
  TickJobArgs,
  World,
  WorldUpdates,
} from './types.js'
import { getNextJobId } from './util.js'
import { Vec2 } from './vec2.js'

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
    let isHome = false
    if (agent.home) {
      const home = world.entities[agent.home]
      invariant(home?.type === EntityType.House)
      if (Vec2.isEqual(home.position, agent.position)) {
        isHome = true
      }
    }

    if (!isHome) {
      agent.fatigue = Math.max(agent.fatigue + AGENT_FATIGUE_PER_TICK, 0)
    } else {
      // don't gain fatigue while home
    }

    let availableStorageCapacity = 0
    let availableStockpileCapacity = 0
    for (let entity of Object.values(world.entities)) {
      if (entity.state.type === EntityStateType.Build) {
        continue
      }

      switch (entity.type) {
        case EntityType.Storage: {
          availableStorageCapacity += STORAGE_CAPACITY - entity.inventory.length
          break
        }
        case EntityType.Stockpile: {
          availableStorageCapacity +=
            STOCKPILE_CAPACITY - entity.inventory.length
          break
        }
      }
    }

    agent.hunger += AGENT_HUNGER_PER_TICK

    if (!agent.jobId && agent.inventory) {
      // TODO pick the closest
      const storage = Object.values(world.entities)
        .filter(
          (entity): entity is StorageEntity =>
            entity.type === EntityType.Storage,
        )
        .find((storage) => storage.inventory.length < STORAGE_CAPACITY)

      if (storage) {
        const job: DropOffItemsJob = {
          id: getNextJobId(),
          type: JobType.DropOffItems,
          entityId: storage.id,
        }
        agent.jobId = job.id
        world.jobs[job.id] = job
      } else {
        console.warn('no storage available, entity is stuck...')
        return
      }
    }

    if (agent.fatigue > 1 && agent.jobId === undefined) {
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

        agent.jobId = job.id
        updates.jobIds.add(job.id)
      }
    }

    if (!agent.jobId) {
      for (const job of Object.values(world.jobs)) {
        switch (job.type) {
          case JobType.CutTrees: {
            if (availableStorageCapacity > 0) {
              agent.jobId = job.id
              updates.agentIds.add(agent.id)
            }
            break
          }
          case JobType.Build: {
            const entity = world.entities[job.entityId]
            invariant(entity)
            invariant(entity.state.type === EntityStateType.Build)

            invariant(
              Object.keys(entity.state.materials).length === 1,
              'TODO support multiple build materials',
            )
            const [itemType, count] = Object.entries(
              entity.state.materials,
            )[0] as [ItemType, number]
            if (
              agent.inventory?.itemType === itemType &&
              agent.inventory.count >= count
            ) {
              agent.jobId = job.id
              updates.agentIds.add(agent.id)
            }

            break
          }
          case JobType.PickGarden: {
            if (availableStorageCapacity > 0) {
              agent.jobId = job.id
              updates.agentIds.add(agent.id)
            }
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

    if (!agent.jobId) {
      const job: AgentRestJob = {
        id: getNextJobId(),
        type: JobType.AgentRest,
      }
      agent.jobId = job.id
      world.jobs[job.id] = job
    }

    if (!agent.jobId) {
      continue
    }

    const job = world.jobs[agent.jobId]
    invariant(job)

    const info: TickJobArgs<unknown>['info'] = {
      availableStorageCapacity,
      availableStockpileCapacity,
    }

    switch (job.type) {
      case JobType.CutTrees:
        tickCutTreesJob({ world, updates, job, agent, info })
        break
      case JobType.Build:
        tickBuildJob({ world, updates, job, agent, info })
        break
      case JobType.PickGarden:
        tickPickGardenJob({ world, updates, job, agent, info })
        break
      case JobType.AgentRest:
        tickAgentRestJob({ world, updates, job, agent, info })
        break
      case JobType.DropOffItems:
        tickDropOffItemsJob({ world, updates, job, agent, info })
        break
      case JobType.WaterGarden:
        tickWaterGardenJob({ world, updates, job, agent, info })
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
