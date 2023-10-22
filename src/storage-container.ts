import { EntityContainer } from './entity-container-v2.js'
import { Entity, Textures } from './types.js'

export class StorageContainer extends EntityContainer {
  constructor(textures: Textures) {
    super()
  }

  update(entity: Entity): void {}
}
