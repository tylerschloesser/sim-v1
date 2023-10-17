import * as PIXI from 'pixi.js'
import { EntityStateType, FarmEntity } from './types.js'
import { useEffect, useState } from 'react'
import { Sprite, useApp } from '@pixi/react'
import { Vec2 } from './vec2.js'
import invariant from 'tiny-invariant'

interface Textures {
  base: PIXI.Texture
  cell1: PIXI.Texture
  cell2: PIXI.Texture
  cell3: PIXI.Texture
  cell4: PIXI.Texture
  cell5: PIXI.Texture
}

export function FarmContainer({ entity }: { entity: FarmEntity }) {
  const app = useApp()
  const [textures, setTextures] = useState<Textures | null>(null)

  useEffect(() => {
    const base = new PIXI.Graphics()
    base.beginFill('hsl(27, 54%, 35%)')
    base.drawRect(0, 0, 400, 400)

    function buildCellTexture(radius: number, fill: string) {
      const g = new PIXI.Graphics()
      g.beginFill('hsla(0, 0%, 0%, .01)')
      g.drawRect(0, 0, 100, 100)
      g.beginFill(fill)
      g.drawCircle(50, 50, radius)
      return app.renderer.generateTexture(g)
    }

    setTextures({
      base: app.renderer.generateTexture(base),
      cell1: buildCellTexture(10, 'green'),
      cell2: buildCellTexture(20, 'green'),
      cell3: buildCellTexture(30, 'green'),
      cell4: buildCellTexture(40, 'green'),
      cell5: buildCellTexture(40, 'black'),
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
      {entity.cells.map(({ ticks }, i) => {
        let texture: PIXI.Texture
        if (ticks < 50) {
          texture = textures.cell1
        } else if (ticks < 100) {
          texture = textures.cell2
        } else if (ticks < 150) {
          texture = textures.cell3
        } else if (ticks < 200) {
          texture = textures.cell4
        } else {
          texture = textures.cell5
        }
        return (
          <Sprite
            position={new Vec2(i % entity.size.x, i / entity.size.y)
              .floor()
              .mul(100)}
            texture={texture}
          />
        )
      })}
    </Sprite>
  )
}
