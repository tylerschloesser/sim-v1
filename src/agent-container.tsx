import { Graphics } from '@pixi/react'
import * as PIXI from 'pixi.js'
import { useCallback } from 'react'
import { useAgents } from './state.js'

export function AgentContainer() {
  const agents = useAgents()

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear()

      for (const agent of Object.values(agents)) {
        g.beginFill('purple')
        g.drawCircle(agent.position.x, agent.position.y, 0.45)
      }
    },
    [agents],
  )

  return <Graphics draw={draw} />
}
