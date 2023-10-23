import { Application, Graphics, Rectangle, Texture } from 'pixi.js'
import { generateAgentTextures } from './agent-container.js'
import { MAX_CELL_SIZE } from './const.js'
import { generateFarmTextures } from './farm-container.js'
import { generateHouseTextures } from './house-container.js'
import { generateStorageTextures } from './storage-container.js'
import { TextureType, Textures } from './types.js'

export function generateTextures(app: Application): Textures {
  return {
    [TextureType.Tree]: generateTreeTexture(app),
    ...generateFarmTextures(app),
    ...generateHouseTextures(app),
    ...generateAgentTextures(app),
    ...generateStorageTextures(app),
  }
}

function generateTreeTexture(app: Application): Texture {
  const g = new Graphics()
  const padding = 0.1

  g.beginFill('hsl(121, 67%, 8%)')
  g.drawRect(
    padding * MAX_CELL_SIZE,
    padding * MAX_CELL_SIZE,
    MAX_CELL_SIZE * (1 - padding * 2),
    MAX_CELL_SIZE * (1 - padding * 2),
  )

  return app.renderer.generateTexture(g, {
    region: new Rectangle(0, 0, MAX_CELL_SIZE, MAX_CELL_SIZE),
  })
}
