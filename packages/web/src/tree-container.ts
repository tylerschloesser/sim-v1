import { Sprite } from 'pixi.js'
import { TEXTURE_SCALE } from './const.js'
import { EntityContainer } from './entity-container.js'
import { Entity, Textures } from './types.js'

export class TreeContainer extends EntityContainer {
  constructor(textures: Textures) {
    super()
    const sprite = new Sprite(textures.tree)
    sprite.setTransform(0, 0, 1 / TEXTURE_SCALE, 1 / TEXTURE_SCALE)
    this.addChild(sprite)
  }
  update(entity: Entity): void {}
}
