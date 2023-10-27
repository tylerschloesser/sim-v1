import { Application, Graphics, Rectangle } from 'pixi.js'
import {
  FARM_SIZE,
  HOUSE_SIZE,
  TEXTURE_SCALE,
  STOCKPILE_SIZE,
  STORAGE_SIZE,
  WELL_SIZE,
} from './const.js'
import { TextureType, Textures } from './types.js'
import { Vec2 } from './vec2.js'

export function generateTextures(app: Application): Textures {
  return {
    ...generateTreeTextures(app),
    ...generateFarmTextures(app),
    ...generateAgentTextures(app),
    ...generateSimpleEntityTextures(app),
    ...generateItemTextures(app),
  }
}

type GenerateTexturesFn<T extends keyof Textures> = (
  app: Application,
) => Pick<Textures, T>

const generateTreeTextures: GenerateTexturesFn<TextureType.Tree> = (app) => {
  const g = new Graphics()
  const padding = 0.1

  g.beginFill('hsl(121, 67%, 8%)')
  g.drawRect(
    padding * TEXTURE_SCALE,
    padding * TEXTURE_SCALE,
    TEXTURE_SCALE * (1 - padding * 2),
    TEXTURE_SCALE * (1 - padding * 2),
  )

  const texture = app.renderer.generateTexture(g, {
    region: new Rectangle(0, 0, TEXTURE_SCALE, TEXTURE_SCALE),
  })
  return {
    [TextureType.Tree]: texture,
  }
}

const generateFarmTextures: GenerateTexturesFn<
  | TextureType.FarmBase
  | TextureType.FarmCell1
  | TextureType.FarmCell2
  | TextureType.FarmCell3
  | TextureType.FarmCell4
  | TextureType.FarmCell5
  | TextureType.FarmCellWater
> = (app) => {
  function buildCellTexture(radius: number, fill: string) {
    const g = new Graphics()
    g.beginFill(fill)
    g.lineStyle(TEXTURE_SCALE * 0.02, 'black')
    const x = TEXTURE_SCALE * (1 / 2 - radius)
    const y = x
    const w = TEXTURE_SCALE * radius * 2
    const h = w
    g.drawRect(x, y, w, h)
    return app.renderer.generateTexture(g, {
      region: new Rectangle(0, 0, TEXTURE_SCALE, TEXTURE_SCALE),
    })
  }

  const baseTexture = (() => {
    const g = new Graphics()
    g.beginFill('hsl(27, 54%, 35%)')
    g.drawRect(0, 0, TEXTURE_SCALE * FARM_SIZE.x, TEXTURE_SCALE * FARM_SIZE.y)
    return app.renderer.generateTexture(g)
  })()

  const cellWaterTexture = (() => {
    const g = new Graphics()
    const n = 4
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (x % 2 === y % 2) continue
        g.beginFill('hsl(240, 20%, 50%)')
        g.drawRect(
          x * (TEXTURE_SCALE / n),
          y * (TEXTURE_SCALE / n),
          TEXTURE_SCALE / n,
          TEXTURE_SCALE / n,
        )
      }
    }
    return app.renderer.generateTexture(g)
  })()

  return {
    [TextureType.FarmBase]: baseTexture,
    [TextureType.FarmCell1]: buildCellTexture(0.1, 'green'),
    [TextureType.FarmCell2]: buildCellTexture(0.166, 'green'),
    [TextureType.FarmCell3]: buildCellTexture(0.233, 'green'),
    [TextureType.FarmCell4]: buildCellTexture(0.3, 'red'),
    [TextureType.FarmCell5]: buildCellTexture(0.3, 'black'),
    [TextureType.FarmCellWater]: cellWaterTexture,
  }
}

const generateAgentTextures: GenerateTexturesFn<
  | TextureType.Agent
  | TextureType.AgentFatigueHigh
  | TextureType.AgentFatigueMedium
  | TextureType.AgentFatigueLow
  | TextureType.AgentHungerHigh
  | TextureType.AgentHungerMedium
  | TextureType.AgentHungerLow
> = (app) => {
  const g = new Graphics()
  g.beginFill('magenta')
  g.lineStyle(TEXTURE_SCALE * 0.02, 'black')
  g.drawCircle(
    TEXTURE_SCALE * 0.5,
    TEXTURE_SCALE * 0.5,
    (TEXTURE_SCALE / 2) * 0.8,
  )

  function buildFatigueTexture(color: string) {
    const padding = 0.05
    const r = 0.15
    g.clear()
    g.beginFill(color)
    g.lineStyle(r * 0.1 * TEXTURE_SCALE, 'black')
    g.drawCircle(
      (1 - r - padding) * TEXTURE_SCALE,
      (r + padding) * TEXTURE_SCALE,
      r * TEXTURE_SCALE,
    )
    return app.renderer.generateTexture(g, {
      region: new Rectangle(0, 0, TEXTURE_SCALE, TEXTURE_SCALE),
    })
  }

  function buildHungerTexture(color: string) {
    const padding = 0.05
    const r = 0.15
    g.clear()
    g.beginFill(color)
    g.lineStyle(r * 0.1 * TEXTURE_SCALE, 'black')
    g.drawCircle(
      (r + padding) * TEXTURE_SCALE,
      (r + padding) * TEXTURE_SCALE,
      r * TEXTURE_SCALE,
    )
    return app.renderer.generateTexture(g, {
      region: new Rectangle(0, 0, TEXTURE_SCALE, TEXTURE_SCALE),
    })
  }

  return {
    [TextureType.Agent]: app.renderer.generateTexture(g, {
      region: new Rectangle(0, 0, TEXTURE_SCALE, TEXTURE_SCALE),
    }),
    [TextureType.AgentFatigueHigh]: buildFatigueTexture('red'),
    [TextureType.AgentFatigueMedium]: buildFatigueTexture('orange'),
    [TextureType.AgentFatigueLow]: buildFatigueTexture('green'),

    [TextureType.AgentHungerHigh]: buildHungerTexture('red'),
    [TextureType.AgentHungerMedium]: buildHungerTexture('orange'),
    [TextureType.AgentHungerLow]: buildHungerTexture('green'),
  }
}

const generateSimpleEntityTextures: GenerateTexturesFn<
  | TextureType.Storage
  | TextureType.Stockpile
  | TextureType.Well
  | TextureType.House
> = (app) => {
  function buildTexture(color: string, size: Vec2) {
    const g = new Graphics()
    g.beginFill(color)
    g.drawRect(0, 0, size.x * TEXTURE_SCALE, size.y * TEXTURE_SCALE)
    return app.renderer.generateTexture(g)
  }
  return {
    [TextureType.Storage]: buildTexture('hsl(0, 0%, 40%)', STORAGE_SIZE),
    [TextureType.Stockpile]: buildTexture('hsl(0, 0%, 60%)', STOCKPILE_SIZE),
    [TextureType.Well]: buildTexture('grey', WELL_SIZE),
    [TextureType.House]: buildTexture('hsl(36, 87%, 20%)', HOUSE_SIZE),
  }
}

const generateItemTextures: GenerateTexturesFn<
  TextureType.ItemFood | TextureType.ItemWood | TextureType.ItemTrash
> = (app) => {
  function buildTexture(color: string) {
    const g = new Graphics()
    g.beginFill(color)
    g.lineStyle(0.05 * TEXTURE_SCALE, 'black')
    const x = 0.15 * TEXTURE_SCALE
    const y = x
    const w = 0.7 * TEXTURE_SCALE
    const h = w
    g.drawRect(x, y, w, h)
    return app.renderer.generateTexture(g, {
      region: new Rectangle(0, 0, TEXTURE_SCALE, TEXTURE_SCALE),
    })
  }

  return {
    [TextureType.ItemFood]: buildTexture('red'),
    [TextureType.ItemWood]: buildTexture('brown'),
    [TextureType.ItemTrash]: buildTexture('black'),
  }
}
