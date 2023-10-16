import { Sprite, useApp } from '@pixi/react'
import * as PIXI from 'pixi.js'
import React, { useEffect, useState } from 'react'
import { useEntities } from './state.js'
import { Entity, EntityType } from './types.js'

interface Textures {
  tree: PIXI.Texture
  house: PIXI.Texture
}

const SingleEntity = React.memo(
  ({ entity, textures }: { entity: Entity; textures: Textures }) => {
    let texture: PIXI.Texture
    switch (entity.type) {
      case EntityType.Tree:
        texture = textures.tree
        break
      case EntityType.House:
        texture = textures.house
        break
    }

    return <Sprite texture={texture} position={entity.position} />
  },
)

export function EntityContainer() {
  const entities = useEntities()

  const app = useApp()

  const [textures, setTextures] = useState<Textures | null>(null)

  useEffect(() => {
    const tree = new PIXI.Graphics()
    tree.beginFill('hsl(121, 67%, 8%)')
    tree.drawCircle(0.5, 0.5, 0.45)

    const house = new PIXI.Graphics()
    house.beginFill('hsl(36, 87%, 20%)')
    house.drawRect(0, 0, 2, 2)

    setTextures({
      tree: app.renderer.generateTexture(tree),
      house: app.renderer.generateTexture(house),
    })
  }, [app])

  if (!textures) return null

  return Object.values(entities).map((entity) => (
    <SingleEntity key={entity.id} entity={entity} textures={textures} />
  ))
}
