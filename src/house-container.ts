import { Application, Graphics } from 'pixi.js'
import { EntityContainer } from './entity-container-v2.js'
import { Entity, TextureType, Textures } from './types.js'
import { MAX_CELL_SIZE } from './const.js'
import { Vec2 } from './vec2.js'

const SIZE = new Vec2(2)

export function generateHouseTextures(
  app: Application,
): Pick<Textures, TextureType.House> {
  const g = new Graphics()
  g.beginFill('hsl(36, 87%, 20%)')
  g.drawRect(0, 0, MAX_CELL_SIZE * SIZE.x, MAX_CELL_SIZE * SIZE.y)
  const texture = app.renderer.generateTexture(g)

  return {
    [TextureType.House]: texture,
  }
}

export class HouseContainer extends EntityContainer {
  constructor() {
    super()
  }

  update(entity: Entity): void {}
}
