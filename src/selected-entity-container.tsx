import { Sprite, useApp } from '@pixi/react'
import * as PIXI from 'pixi.js'
import { useEffect, useState } from 'react'
import invariant from 'tiny-invariant'
import { useEntities, useSelectedEntityIds } from './state.js'
import { Entity } from './types.js'
import { Vec2 } from './vec2.js'

type Textures = Record<string, PIXI.Texture>

export function SelectedEntityContainer() {
  const app = useApp()
  const [textures, setTextures] = useState<Textures | null>(null)

  useEffect(() => {
    const _textures: Textures = {}
    const g = new PIXI.Graphics()
    for (const size of [new Vec2(1), new Vec2(2)]) {
      g.clear()
      const lineWidth = 0.1
      g.beginFill('transparent')
      g.lineStyle(lineWidth, 'yellow')
      g.drawRect(
        lineWidth / 2,
        lineWidth / 2,
        size.x - lineWidth,
        size.y - lineWidth,
      )
      _textures[`${size.x}.${size.y}`] = app.renderer.generateTexture(g)
    }
    setTextures(_textures)
  }, [app])

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

  if (!textures) return null

  return selectedEntities.map((entity) => {
    const texture = textures[`${entity.size.x}.${entity.size.y}`]
    invariant(texture)

    return (
      <Sprite key={entity.id} texture={texture} position={entity.position} />
    )
  })
}
