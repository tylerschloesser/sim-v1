import * as PIXI from 'pixi.js'
import invariant from 'tiny-invariant'
import { useEntities, useSelectedEntityIds } from './state.js'
import { Entity } from './types.js'
import { useCallback } from 'react'
import { Graphics } from '@pixi/react'

export function SelectedEntityContainer() {
  const selectedEntityIds = useSelectedEntityIds()
  const entities = useEntities()

  let selectedEntities: Entity[] = []
  if (selectedEntityIds) {
    selectedEntities = [...selectedEntityIds].map((id) => {
      const entity = entities[id]
      invariant(entity)
      return entity
    })
  }

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear()
      g.beginFill('transparent')
      g.lineStyle(0.1, 'yellow')
      for (const entity of selectedEntities) {
        g.drawRect(
          entity.position.x,
          entity.position.y,
          entity.size.x,
          entity.size.y,
        )
      }
    },
    [selectedEntities],
  )

  return <Graphics draw={draw} />
}
