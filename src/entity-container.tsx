import { Graphics } from '@pixi/react'
import * as PIXI from 'pixi.js'
import { useEntities } from './state.js'

export function EntityContainer() {
  const entities = useEntities()

  const draw = (g: PIXI.Graphics) => {
    g.clear()
    for (const entity of Object.values(entities)) {
      g.beginFill('pink')
      g.drawRect(
        entity.position.x,
        entity.position.y,
        entity.size.x,
        entity.size.y,
      )
    }
  }

  return <Graphics draw={draw} />
}
