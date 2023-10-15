import { Graphics } from '@pixi/react'
import * as PIXI from 'pixi.js'
import { useCallback } from 'react'
import { useBuild } from './state.js'

export function BuildContainer() {
  const build = useBuild()

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      if (!build) return
      g.clear()
      const color = build.valid ? 'brown' : 'red'
      g.beginFill(color)
      g.drawRect(0, 0, build.size.x, build.size.y)
    },
    [build],
  )

  if (build === null) return null

  return <Graphics position={build.position} draw={draw} />
}
