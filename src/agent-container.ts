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

    if (agent.energy > 0.5) {
      this.energy = new Sprite(this.textures[TextureType.AgentEnergyHigh])
    } else if (agent.energy > 0) {
      this.energy = new Sprite(this.textures[TextureType.AgentEnergyMedium])
    } else {
      this.energy = new Sprite(this.textures[TextureType.AgentEnergyLow])
    }

    this.addChild(this.energy)
  }
}
