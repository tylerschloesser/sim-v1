import { Application, Graphics, Rectangle } from 'pixi.js'
import {
  FARM_SIZE,
  HOUSE_SIZE,
  MAX_CELL_SIZE,
  STORAGE_SIZE,
  WELL_SIZE,
} from './const.js'
import { TextureType, Textures } from './types.js'

export function generateTextures(app: Application): Textures {
  return {
    ...generateTreeTextures(app),
    ...generateFarmTextures(app),
    ...generateHouseTextures(app),
    ...generateAgentTextures(app),
    ...generateStorageTextures(app),
    ...generateWellTextures(app),
    ...generateItemTextures(app),
  }
}

type GenerateTexturesFn<T extends keyof Textures> = (
  app: Application,
) => Pick<Textures, T>

const generateWellTextures: GenerateTexturesFn<TextureType.Well> = (app) => {
  const g = new Graphics()
  g.beginFill('grey')
  g.drawRect(0, 0, MAX_CELL_SIZE * WELL_SIZE.x, MAX_CELL_SIZE * WELL_SIZE.y)
  return {
    [TextureType.Well]: app.renderer.generateTexture(g),
  }
}

const generateTreeTextures: GenerateTexturesFn<TextureType.Tree> = (app) => {
  const g = new Graphics()
  const padding = 0.1

  g.beginFill('hsl(121, 67%, 8%)')
  g.drawRect(
    padding * MAX_CELL_SIZE,
    padding * MAX_CELL_SIZE,
    MAX_CELL_SIZE * (1 - padding * 2),
    MAX_CELL_SIZE * (1 - padding * 2),
  )

  const texture = app.renderer.generateTexture(g, {
    region: new Rectangle(0, 0, MAX_CELL_SIZE, MAX_CELL_SIZE),
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
    g.lineStyle(MAX_CELL_SIZE * 0.02, 'black')
    const x = MAX_CELL_SIZE * (1 / 2 - radius)
    const y = x
    const w = MAX_CELL_SIZE * radius * 2
    const h = w
    g.drawRect(x, y, w, h)
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

  const cellWaterTexture = (() => {
    const g = new Graphics()
    const n = 4
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (x % 2 === y % 2) continue
        g.beginFill('hsl(240, 20%, 50%)')
        g.drawRect(
          x * (MAX_CELL_SIZE / n),
          y * (MAX_CELL_SIZE / n),
          MAX_CELL_SIZE / n,
          MAX_CELL_SIZE / n,
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

const generateHouseTextures: GenerateTexturesFn<TextureType.House> = (app) => {
  const g = new Graphics()
  g.beginFill('hsl(36, 87%, 20%)')
  g.drawRect(0, 0, MAX_CELL_SIZE * HOUSE_SIZE.x, MAX_CELL_SIZE * HOUSE_SIZE.y)
  const texture = app.renderer.generateTexture(g)

  return {
    [TextureType.House]: texture,
  }
}

const generateAgentTextures: GenerateTexturesFn<
  | TextureType.Agent
  | TextureType.AgentEnergyHigh
  | TextureType.AgentEnergyMedium
  | TextureType.AgentEnergyLow
> = (app) => {
  const g = new Graphics()
  g.beginFill('magenta')
  g.lineStyle(MAX_CELL_SIZE * 0.02, 'black')
  g.drawCircle(
    MAX_CELL_SIZE * 0.5,
    MAX_CELL_SIZE * 0.5,
    (MAX_CELL_SIZE / 2) * 0.8,
  )

  function buildEnergyTexture(color: string) {
    const padding = 0.05
    const r = 0.15
    g.clear()
    g.beginFill(color)
    g.lineStyle(r * 0.1 * MAX_CELL_SIZE, 'black')
    g.drawCircle(
      (1 - r - padding) * MAX_CELL_SIZE,
      (r + padding) * MAX_CELL_SIZE,
      r * MAX_CELL_SIZE,
    )
    return app.renderer.generateTexture(g, {
      region: new Rectangle(0, 0, MAX_CELL_SIZE, MAX_CELL_SIZE),
    })
  }

  return {
    [TextureType.Agent]: app.renderer.generateTexture(g, {
      region: new Rectangle(0, 0, MAX_CELL_SIZE, MAX_CELL_SIZE),
    }),
    [TextureType.AgentEnergyHigh]: buildEnergyTexture('green'),
    [TextureType.AgentEnergyMedium]: buildEnergyTexture('orange'),
    [TextureType.AgentEnergyLow]: buildEnergyTexture('red'),
  }
}

const generateStorageTextures: GenerateTexturesFn<TextureType.Storage> = (
  app,
) => {
  const g = new Graphics()
  g.beginFill('hsl(0, 0%, 40%)')
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

const generateItemTextures: GenerateTexturesFn<
  TextureType.ItemFood | TextureType.ItemWood | TextureType.ItemTrash
> = (app) => {
  function buildTexture(color: string) {
    const g = new Graphics()
    g.beginFill(color)
    g.lineStyle(0.05 * MAX_CELL_SIZE, 'black')
    const x = 0.1 * MAX_CELL_SIZE
    const y = x
    const w = 0.8 * MAX_CELL_SIZE
    const h = w
    g.drawRect(x, y, w, h)
    return app.renderer.generateTexture(g, {
      region: new Rectangle(0, 0, MAX_CELL_SIZE, MAX_CELL_SIZE),
    })
  }

  return {
    [TextureType.ItemFood]: buildTexture('red'),
    [TextureType.ItemWood]: buildTexture('brown'),
    [TextureType.ItemTrash]: buildTexture('black'),
  }
}
