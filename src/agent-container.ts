import { Sprite } from 'pixi.js'
import { MAX_CELL_SIZE } from './const.js'
import { Agent, Textures } from './types.js'

export class AgentContainer extends Sprite {
  constructor(textures: Textures, agent: Agent) {
    super(textures.agent)
    this.update(agent)
  }

  update(agent: Agent): void {
    this.setTransform(
      agent.position.x,
      agent.position.y,
      1 / MAX_CELL_SIZE,
      1 / MAX_CELL_SIZE,
    )
  }
}
