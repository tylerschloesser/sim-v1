import { Graphics } from '@pixi/react'
import * as PIXI from 'pixi.js'
import { useEntities } from './state.js'
import { useCallback } from 'react'
import { EntityType } from './types.js'

export function EntityContainer() {
  const entities = useEntities()

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear()
      for (const entity of Object.values(entities)) {
        let color
        switch (entity.type) {
          case EntityType.House:
            color = 'hsl(36, 87%, 20%)'
            break
          case EntityType.Tree:
            color = 'hsl(121, 67%, 8%)'
            break
        }

        g.beginFill(color)

        if (entity.type === EntityType.Tree) {
          g.drawCircle(entity.position.x + 0.5, entity.position.y + 0.5, 0.45)
        } else {
          g.drawRect(
            entity.position.x,
            entity.position.y,
            entity.size.x,
            entity.size.y,
          )
        }
      }
    },
    [entities],
  )

  return <Graphics draw={draw} />
}
