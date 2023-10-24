import invariant from 'tiny-invariant'
import { move } from './tick-util.js'
import { AgentRestJob, EntityType, TickJobFn } from './types.js'
import { AGENT_FATIGUE_REPLENISH_PER_TICK } from './const.js'

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

  agent.fatigue = Math.max(0, agent.fatigue - AGENT_FATIGUE_REPLENISH_PER_TICK)
  if (agent.fatigue === 0) {
    delete world.jobs[job.id]
    delete agent.jobId

    updates.jobIds.add(job.id)
  }
}
