import { Container, Sprite } from 'pixi.js'
import { MAX_CELL_SIZE } from './const.js'
import { Agent, TextureType, Textures } from './types.js'

export class AgentContainer extends Container {
  private sprite: Sprite
  private energy?: Sprite
  private textures: Textures

  constructor(textures: Textures, agent: Agent) {
    super()
    this.sprite = new Sprite(textures.agent)
    this.addChild(this.sprite)
    this.textures = textures
    this.update(agent)
  }

  update(agent: Agent): void {
    this.setTransform(
      agent.position.x,
      agent.position.y,
      1 / MAX_CELL_SIZE,
      1 / MAX_CELL_SIZE,
    )

    if (this.energy) {
      this.removeChild(this.energy)
      this.energy.destroy()
    }

    if (agent.fatigue > 1) {
      this.energy = new Sprite(this.textures[TextureType.AgentFatigueHigh])
    } else if (agent.fatigue > 0.5) {
      this.energy = new Sprite(this.textures[TextureType.AgentFatigueMedium])
    } else {
      this.energy = new Sprite(this.textures[TextureType.AgentFatigueLow])
    }

    this.addChild(this.energy)
  }
}
