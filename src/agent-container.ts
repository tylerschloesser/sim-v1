import { Container, Sprite } from 'pixi.js'
import { MAX_CELL_SIZE } from './const.js'
import { Agent, TextureType, Textures } from './types.js'

export class AgentContainer extends Container {
  private sprite: Sprite
  private fatigue?: Sprite
  private hunger?: Sprite
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

    this.updateFatigue(agent)
    this.updateHunger(agent)
  }

  updateFatigue(agent: Agent): void {
    if (this.fatigue) {
      this.removeChild(this.fatigue)
      this.fatigue.destroy()
    }

    if (agent.fatigue > 1) {
      this.fatigue = new Sprite(this.textures[TextureType.AgentFatigueHigh])
    } else if (agent.fatigue > 0.5) {
      this.fatigue = new Sprite(this.textures[TextureType.AgentFatigueMedium])
    } else {
      this.fatigue = new Sprite(this.textures[TextureType.AgentFatigueLow])
    }

    this.addChild(this.fatigue)
  }

  updateHunger(agent: Agent): void {
    if (this.hunger) {
      this.removeChild(this.hunger)
      this.hunger.destroy()
    }

    if (agent.hunger > 1) {
      this.hunger = new Sprite(this.textures[TextureType.AgentHungerHigh])
    } else if (agent.hunger > 0.5) {
      this.hunger = new Sprite(this.textures[TextureType.AgentHungerMedium])
    } else {
      this.hunger = new Sprite(this.textures[TextureType.AgentHungerLow])
    }

    this.addChild(this.hunger)
  }
}
