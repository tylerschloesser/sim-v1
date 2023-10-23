import invariant from 'tiny-invariant'
import { AGENT_ENERGY_REPLENISH_PER_TICK } from './const.js'
import { move } from './tick-util.js'
import { AgentRestJob, EntityType, TickJobFn } from './types.js'

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

  const { arrived } = move(agent, home.position)
  updates.agentIds.add(agent.id)

  if (!arrived) {
    return
  }

  agent.energy = Math.min(1, agent.energy + AGENT_ENERGY_REPLENISH_PER_TICK)
  if (agent.energy === 1) {
    delete world.jobs[job.id]
    delete agent.jobId

    updates.jobIds.add(job.id)
  }
}
