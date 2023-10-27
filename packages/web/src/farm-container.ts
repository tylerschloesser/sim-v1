import { Container, Sprite, Texture } from 'pixi.js'
import invariant from 'tiny-invariant'
import { FARM_MATURITY_THRESHOLD, FARM_SIZE, TEXTURE_SCALE } from './const.js'
import { EntityContainer } from './entity-container.js'
import { Entity, EntityType, TextureType, Textures } from './types.js'

export class FarmContainer extends EntityContainer {
  private readonly base: Sprite
  private readonly textures: Textures

  private cells?: Container

  constructor(textures: Textures) {
    super()

    const base = new Sprite(textures[TextureType.FarmBase])
    base.setTransform(0, 0, 1 / TEXTURE_SCALE, 1 / TEXTURE_SCALE)
    this.addChild(base)

    this.base = base

    this.textures = textures
  }

  update(entity: Entity) {
    invariant(entity.type === EntityType.Farm)

    if (this.cells) {
      this.base.removeChild(this.cells)
      this.cells.destroy({ children: true })
    }
    this.cells = new Container()
    this.base.addChild(this.cells)

    for (let i = 0; i < entity.cells.length; i++) {
      const cell = entity.cells[i]
      invariant(cell)
      const { maturity } = cell
      let texture: Texture
      if (maturity < FARM_MATURITY_THRESHOLD * (1 / 3)) {
        texture = this.textures[TextureType.FarmCell1]
      } else if (maturity < FARM_MATURITY_THRESHOLD * (2 / 3)) {
        texture = this.textures[TextureType.FarmCell2]
      } else if (maturity < FARM_MATURITY_THRESHOLD) {
        texture = this.textures[TextureType.FarmCell3]
      } else {
        texture = this.textures[TextureType.FarmCell4]
      }

      const container = new Container()
      container.setTransform(
        (i % FARM_SIZE.x) * TEXTURE_SCALE,
        Math.floor(i / FARM_SIZE.y) * TEXTURE_SCALE,
      )

      if (cell.water > 0) {
        container.addChild(new Sprite(this.textures[TextureType.FarmCellWater]))
      }

      container.addChild(new Sprite(texture))

      this.cells.addChild(container)
    }
  }
}
