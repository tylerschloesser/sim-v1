import { Agent } from './types.js'
import { Vec2 } from './vec2.js'

export function move(
  agent: Agent,
  target: Vec2,
): {
  arrived: boolean
} {
  if (Vec2.isEqual(agent.position, target)) {
    return { arrived: true }
  }

  const delta = target.sub(agent.position)

  const speed = agent.energy > 0 ? 1 : 0.25

  if (delta.dist() <= speed) {
    agent.position = target
  } else {
    const velocity = delta.norm().mul(speed)
    agent.position = agent.position.add(velocity)
  }

  return { arrived: false }
}
