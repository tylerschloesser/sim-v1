import { Container, Sprite } from 'pixi.js'
import { MAX_CELL_SIZE } from './const.js'
import { EntityContainer } from './entity-container.js'
import { Entity, EntityType, ItemType, TextureType, Textures } from './types.js'
import invariant from 'tiny-invariant'

export class StorageContainer extends EntityContainer {
  private inventory?: Container
  private textures: Textures

  constructor(textures: Textures) {
    super()
    this.textures = textures

    const sprite = new Sprite(textures.storage)
    sprite.setTransform(0, 0, 1 / MAX_CELL_SIZE, 1 / MAX_CELL_SIZE)
    this.addChild(sprite)
  }

  update(entity: Entity): void {
    invariant(entity.type === EntityType.Storage)
    if (this.inventory) {
      this.removeChild(this.inventory)
      this.inventory.destroy({ children: true })
    }

    this.inventory = new Container()
    this.addChild(this.inventory)
    this.inventory.setTransform(0, 0, 1 / MAX_CELL_SIZE, 1 / MAX_CELL_SIZE)

    for (let i = 0; i < entity.inventory.length; i++) {
      const itemType = entity.inventory[i]
      invariant(itemType)

      let textureType: TextureType
      switch (itemType) {
        case ItemType.Food:
          textureType = TextureType.ItemFood
          break
        case ItemType.Wood:
          textureType = TextureType.ItemWood
          break
        case ItemType.Trash:
          textureType = TextureType.ItemTrash
          break
        case ItemType.WaterBucket:
          invariant(false, 'water bucket not supported')
      }

      const sprite = new Sprite(this.textures[textureType])
      sprite.setTransform(i * 0.5 * MAX_CELL_SIZE, 0)
      this.inventory.addChild(sprite)
    }
  }
}
