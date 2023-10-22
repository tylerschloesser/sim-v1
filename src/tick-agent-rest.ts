import invariant from 'tiny-invariant'
import { AGENT_ENERGY_REPLENISH_PER_TICK } from './const.js'
import { AgentRestJob, EntityType, TickJobFn } from './types.js'
import { Vec2 } from './vec2.js'

export const tickAgentRestJob: TickJobFn<AgentRestJob> = ({
  world,
  updates,
  job,
  agent,
}) => {
  if (!agent.home) {
    return
  }

  const home = world.entities[agent.home]
  invariant(home?.type === EntityType.House)

  if (Vec2.isEqual(agent.position, home.position)) {
    agent.energy = Math.min(1, agent.energy + AGENT_ENERGY_REPLENISH_PER_TICK)
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
