import {
  Application,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Texture,
} from 'pixi.js'
import invariant from 'tiny-invariant'
import {
  FARM_DEAD_THRESHOLD,
  FARM_MATURITY_THRESHOLD,
  FARM_SIZE,
  MAX_CELL_SIZE,
} from './const.js'
import { EntityContainer } from './entity-container-v2.js'
import { Entity, EntityType, TextureType, Textures } from './types.js'

export function generateFarmTextures(
  app: Application,
): Pick<
  Textures,
  | TextureType.FarmBase
  | TextureType.FarmCell1
  | TextureType.FarmCell2
  | TextureType.FarmCell3
  | TextureType.FarmCell4
  | TextureType.FarmCell5
> {
  function buildCellTexture(radius: number, fill: string) {
    const g = new Graphics()
    g.beginFill(fill)
    g.drawCircle(MAX_CELL_SIZE / 2, MAX_CELL_SIZE / 2, radius * MAX_CELL_SIZE)
    return app.renderer.generateTexture(g, {
      region: new Rectangle(0, 0, MAX_CELL_SIZE, MAX_CELL_SIZE),
    })
  }

  const baseTexture = (() => {
    const g = new Graphics()
    g.beginFill('hsl(27, 54%, 35%)')
    g.drawRect(0, 0, MAX_CELL_SIZE * FARM_SIZE.x, MAX_CELL_SIZE * FARM_SIZE.y)
    return app.renderer.generateTexture(g)
  })()

  return {
    [TextureType.FarmBase]: baseTexture,
    [TextureType.FarmCell1]: buildCellTexture(0.1, 'green'),
    [TextureType.FarmCell2]: buildCellTexture(0.2, 'green'),
    [TextureType.FarmCell3]: buildCellTexture(0.3, 'green'),
    [TextureType.FarmCell4]: buildCellTexture(0.4, 'green'),
    [TextureType.FarmCell5]: buildCellTexture(0.4, 'black'),
  }
}

export class FarmContainer extends EntityContainer {
  private readonly base: Sprite
  private readonly textures: Textures

  private cellContainer?: Container

  constructor(textures: Textures) {
    super()

    const base = new Sprite(textures[TextureType.FarmBase])
    base.setTransform(0, 0, 1 / MAX_CELL_SIZE, 1 / MAX_CELL_SIZE)
    this.addChild(base)

    this.base = base

    this.textures = textures
  }

  update(entity: Entity) {
    invariant(entity.type === EntityType.Farm)

    if (this.cellContainer) {
      this.base.removeChild(this.cellContainer)
      this.cellContainer.destroy({ children: true })
    }
    this.cellContainer = new Container()
    this.base.addChild(this.cellContainer)

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
      } else if (maturity < FARM_DEAD_THRESHOLD) {
        texture = this.textures[TextureType.FarmCell4]
      } else {
        texture = this.textures[TextureType.FarmCell5]
      }
      const sprite = new Sprite(texture)
      sprite.setTransform(
        (i % FARM_SIZE.x) * MAX_CELL_SIZE,
        Math.floor(i / FARM_SIZE.y) * MAX_CELL_SIZE,
      )

      this.cellContainer.addChild(sprite)
    }
  }
}
