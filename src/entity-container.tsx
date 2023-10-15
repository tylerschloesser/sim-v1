import { Graphics } from '@pixi/react'
import * as PIXI from 'pixi.js'
import { useEntities } from './state.js'
import { useCallback } from 'react'

export function EntityContainer() {
  const entities = useEntities()

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear()
      for (const entity of Object.values(entities)) {
        g.beginFill('hsl(36, 87%, 20%)')
        g.drawRect(
          entity.position.x,
          entity.position.y,
          entity.size.x,
          entity.size.y,
        )
      }
    },
    [entities],
  )

  return <Graphics draw={draw} />
}
