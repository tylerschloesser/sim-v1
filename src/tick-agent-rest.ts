import { Agent, AgentRestJob, World, WorldUpdates } from './types.js'

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
}): void {}
