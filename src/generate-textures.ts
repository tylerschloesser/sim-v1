import { Application, Graphics, Rectangle } from 'pixi.js'
import { FARM_SIZE, HOUSE_SIZE, MAX_CELL_SIZE, STORAGE_SIZE } from './const.js'
import { TextureType, Textures } from './types.js'

export function generateTextures(app: Application): Textures {
  return {
    ...generateTreeTextures(app),
    ...generateFarmTextures(app),
    ...generateHouseTextures(app),
    ...generateAgentTextures(app),
    ...generateStorageTextures(app),
  }
}

function generateTreeTextures(
  app: Application,
): Pick<Textures, TextureType.Tree> {
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

function generateFarmTextures(
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

function generateHouseTextures(
  app: Application,
): Pick<Textures, TextureType.House> {
  const g = new Graphics()
  g.beginFill('hsl(36, 87%, 20%)')
  g.drawRect(0, 0, MAX_CELL_SIZE * HOUSE_SIZE.x, MAX_CELL_SIZE * HOUSE_SIZE.y)
  const texture = app.renderer.generateTexture(g)

  return {
    [TextureType.House]: texture,
  }
}

function generateAgentTextures(
  app: Application,
): Pick<Textures, TextureType.Agent> {
  const g = new Graphics()
  g.beginFill('magenta')
  g.drawCircle(
    MAX_CELL_SIZE * 0.5,
    MAX_CELL_SIZE * 0.5,
    (MAX_CELL_SIZE / 2) * 0.8,
  )
  return {
    [TextureType.Agent]: app.renderer.generateTexture(g, {
      region: new Rectangle(0, 0, MAX_CELL_SIZE, MAX_CELL_SIZE),
    }),
  }
}

function generateStorageTextures(
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
