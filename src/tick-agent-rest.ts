import invariant from 'tiny-invariant'
import {
  Agent,
  AgentRestJob,
  EntityType,
  World,
  WorldUpdates,
} from './types.js'
import { Vec2 } from './vec2.js'

// how many ticks before full energy?
const REST_FACTOR = 20

export function tickAgentRestJob({
  world,
  updates,
  job,
  agent,
}: {
  world: World
  updates: WorldUpdates
  job: AgentRestJob
  agent: Agent
}): void {
  if (!agent.home) {
    return
  }

  const home = world.entities[agent.home]
  invariant(home?.type === EntityType.House)

  if (Vec2.isEqual(agent.position, home.position)) {
    agent.energy = Math.min(1, agent.energy + 1 / REST_FACTOR)
    if (agent.energy === 1) {
      delete world.jobs[job.id]
      delete agent.jobId
    }
  } else {
    const delta = home.position.sub(agent.position)
    const speed = 1

    if (delta.dist() <= speed) {
      agent.position = home.position
    } else {
      const velocity = delta.norm().mul(speed)
      agent.position = agent.position.add(velocity)
    }
  }

  updates.agentIds.add(agent.id)
}
