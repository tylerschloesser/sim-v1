import { Container, Sprite } from 'pixi.js'
import { MAX_CELL_SIZE } from './const.js'
import { EntityContainer } from './entity-container.js'
import { Entity, Textures } from './types.js'

export class StorageContainer extends EntityContainer {
  private inventory?: Container

  constructor(textures: Textures) {
    super()

    const sprite = new Sprite(textures.storage)
    sprite.setTransform(0, 0, 1 / MAX_CELL_SIZE, 1 / MAX_CELL_SIZE)
    this.addChild(sprite)
  }

  update(entity: Entity): void {
    if (this.inventory) {
      this.removeChild(this.inventory)
      this.inventory.destroy()
    }

    this.inventory = new Container()
    this.addChild(this.inventory)
  }
}
