import {
  Application,
  Container,
  IRenderer,
  Graphics as PixiGraphics,
  Sprite,
  Texture,
} from 'pixi.js'
import { CellType, ChunkId, Chunk } from './types.js'
import { Vec2 } from './vec2.js'
import invariant from 'tiny-invariant'
import { CHUNK_SIZE, MAX_CELL_SIZE } from './const.js'

function buildTexture(renderer: IRenderer, color: string): Texture {
  const g = new PixiGraphics()
  g.beginFill(color)
  g.drawRect(0, 0, 1, 1)
  return renderer.generateTexture(g)
}

const CELL_TYPE_TO_COLOR: Record<CellType, string> = {
  [CellType.Grass1]: 'hsl(121, 67%, 26%)',
  [CellType.Grass2]: 'hsl(121, 67%, 20%)',
  [CellType.Grass3]: 'hsl(121, 67%, 14%)',
  [CellType.WaterDeep]: 'hsl(220, 90%, 32%)',
  [CellType.WaterShallow]: 'hsl(220, 64%, 64%)',
}

export class Graphics {
  private readonly app: Application
  private readonly world: Container

  private readonly cellTypeToTexture: Record<CellType, Texture>

  private readonly chunkIdToSprite: Map<ChunkId, Sprite>

  constructor({
    canvas,
    container,
  }: {
    canvas: HTMLCanvasElement
    container: HTMLDivElement
  }) {
    this.app = new Application({
      view: canvas,
      resizeTo: container,
      antialias: true,
    })

    this.world = new Container()
    this.app.stage.addChild(this.world)

    const g = new PixiGraphics()
    g.beginFill('red')
    g.drawRect(0, 0, 1, 1)
    this.world.addChild(g)

    const { renderer } = this.app

    this.cellTypeToTexture = {
      [CellType.Grass1]: buildTexture(renderer, 'hsl(121, 67%, 26%)'),
      [CellType.Grass2]: buildTexture(renderer, 'hsl(121, 67%, 20%)'),
      [CellType.Grass3]: buildTexture(renderer, 'hsl(121, 67%, 14%)'),
      [CellType.WaterDeep]: buildTexture(renderer, 'hsl(220, 90%, 32%)'),
      [CellType.WaterShallow]: buildTexture(renderer, 'hsl(220, 64%, 64%)'),
    }

    this.chunkIdToSprite = new Map()
  }

  destroy() {
    this.app.destroy(false, { children: true })
  }

  transformWorld({ translate, scale }: { translate: Vec2; scale: number }) {
    this.world.setTransform(translate.x, translate.y, scale, scale)
  }

  showChunk({ chunk }: { chunk: Chunk }) {
    let sprite = this.chunkIdToSprite.get(chunk.id)
    if (!sprite) {
      const g = new PixiGraphics()
      invariant(chunk.cells.length === CHUNK_SIZE ** 2)
      for (let i = 0; i < chunk.cells.length; i++) {
        const cell = chunk.cells[i]
        invariant(cell)
        g.beginFill(CELL_TYPE_TO_COLOR[cell.type])
        const { x, y } = new Vec2(i % CHUNK_SIZE, i / CHUNK_SIZE)
          .floor()
          .mul(MAX_CELL_SIZE)
        g.drawRect(x, y, MAX_CELL_SIZE, MAX_CELL_SIZE)
      }
      const texture = this.app.renderer.generateTexture(g)

      sprite = new Sprite(texture)
      sprite.setTransform(
        chunk.position.x,
        chunk.position.y,
        1 / MAX_CELL_SIZE,
        1 / MAX_CELL_SIZE,
      )
      this.chunkIdToSprite.set(chunk.id, sprite)
      this.world.addChild(sprite)
    }
    sprite.visible = true
  }
}
