import { Application, Container, Graphics, Rectangle, Sprite } from 'pixi.js'
import { TextureType, Textures } from './types.js'
import { MAX_CELL_SIZE } from './const.js'
import { Vec2 } from './vec2.js'

const SIZE = new Vec2(4)

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
    g.drawRect(0, 0, MAX_CELL_SIZE * SIZE.x, MAX_CELL_SIZE * SIZE.y)
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

export class FarmContainer extends Container {
  constructor(textures: Textures) {
    super()

    const base = new Sprite(textures[TextureType.FarmBase])
    base.setTransform(0, 0, 1 / MAX_CELL_SIZE, 1 / MAX_CELL_SIZE)
    this.addChild(base)
  }

  // update(entity: FarmEntity) {

  // }
}
