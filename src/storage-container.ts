import { Application, Graphics, Sprite } from 'pixi.js'
import { MAX_CELL_SIZE, STORAGE_SIZE } from './const.js'
import { EntityContainer } from './entity-container-v2.js'
import { Entity, TextureType, Textures } from './types.js'

export function generateStorageTextures(
  app: Application,
): Pick<Textures, TextureType.Storage> {
  const g = new Graphics()
  g.beginFill('cyan')
  g.drawRect(
    0,
    0,
    STORAGE_SIZE.x * MAX_CELL_SIZE,
    STORAGE_SIZE.y * MAX_CELL_SIZE,
  )
  return {
    [TextureType.Storage]: app.renderer.generateTexture(g),
  }
}

export class StorageContainer extends EntityContainer {
  constructor(textures: Textures) {
    super()
    const sprite = new Sprite(textures.storage)
    sprite.setTransform(0, 0, 1 / MAX_CELL_SIZE, 1 / MAX_CELL_SIZE)
    this.addChild(sprite)
  }

  update(entity: Entity): void {}
}
