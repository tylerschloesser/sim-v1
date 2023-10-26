import { Sprite } from 'pixi.js'
import invariant from 'tiny-invariant'
import { MAX_CELL_SIZE } from './const.js'
import { EntityContainer } from './entity-container.js'
import { Entity, EntityType, Textures } from './types.js'

export class HouseContainer extends EntityContainer {
  constructor(textures: Textures) {
    super()
    const sprite = new Sprite(textures.house)
    sprite.setTransform(0, 0, 1 / MAX_CELL_SIZE, 1 / MAX_CELL_SIZE)
    this.addChild(sprite)
  }

  update(entity: Entity): void {
    invariant(entity.type === EntityType.House)
  }
}
