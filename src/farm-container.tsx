import * as PIXI from 'pixi.js'
import { EntityStateType, FarmEntity } from './types.js'
import { useEffect, useState } from 'react'
import { Sprite, useApp } from '@pixi/react'
import { Vec2 } from './vec2.js'

interface Textures {
  base: PIXI.Texture
  cell1: PIXI.Texture
}

export function FarmContainer({ entity }: { entity: FarmEntity }) {
  const app = useApp()
  const [textures, setTextures] = useState<Textures | null>(null)

  useEffect(() => {
    const base = new PIXI.Graphics()
    base.beginFill('hsl(27, 54%, 35%)')
    base.drawRect(0, 0, 400, 400)

    const cell1 = new PIXI.Graphics()
    cell1.beginFill('hsla(0, 0%, 0%, .01)')
    cell1.drawRect(0, 0, 100, 100)
    cell1.beginFill('green')
    cell1.drawCircle(50, 50, 10)

    setTextures({
      base: app.renderer.generateTexture(base),
      cell1: app.renderer.generateTexture(cell1),
    })
  }, [])

  if (!textures) return null

  const alpha = entity.state.type === EntityStateType.Build ? 0.5 : 1

  return (
    <Sprite
      texture={textures.base}
      position={entity.position}
      scale={1 / 100}
      alpha={alpha}
    >
      {entity.cells.map(({ age }, i) => {
        return (
          <Sprite
            position={new Vec2(i % entity.size.x, i / entity.size.y)
              .floor()
              .mul(100)}
            texture={textures.cell1}
          />
        )
      })}
    </Sprite>
  )
}
