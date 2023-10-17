import * as PIXI from 'pixi.js'
import { EntityStateType, FarmEntity } from './types.js'
import { useEffect, useState } from 'react'
import { Sprite, useApp } from '@pixi/react'

interface Textures {
  base: PIXI.Texture
}

export function FarmContainer({ entity }: { entity: FarmEntity }) {
  const app = useApp()
  const [textures, setTextures] = useState<Textures | null>(null)

  useEffect(() => {
    const base = new PIXI.Graphics()
    base.beginFill('hsl(27, 54%, 35%)')
    base.drawRect(0, 0, 400, 400)

    setTextures({ base: app.renderer.generateTexture(base) })
  }, [])

  if (!textures) return null

  const alpha = entity.state.type === EntityStateType.Build ? 0.5 : 1

  return (
    <Sprite
      texture={textures.base}
      position={entity.position}
      scale={1 / 100}
      alpha={alpha}
    />
  )
}
