import { Application, Graphics, Rectangle } from 'pixi.js'
import { MAX_CELL_SIZE } from './const.js'
import { TextureType, Textures } from './types.js'

export function generateAgentTextures(
  app: Application,
): Pick<Textures, TextureType.Agent> {
  const g = new Graphics()
  g.beginFill('magenta')
  g.drawCircle(0.5, 0.5, (MAX_CELL_SIZE / 2) * 0.8)
  return {
    [TextureType.Agent]: app.renderer.generateTexture(g, {
      region: new Rectangle(0, 0, MAX_CELL_SIZE, MAX_CELL_SIZE),
    }),
  }
}
