import { Graphics } from '@pixi/react'
import * as PIXI from 'pixi.js'
import { useCallback } from 'react'
import { useBuild } from './state.js'

export function BuildContainer() {
  const build = useBuild()

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear()
      g.beginFill('red')
      g.drawRect(0, 0, 2, 2)
    },
    [build?.entityType],
  )

  if (build === null) return null

  return <Graphics position={build.position} draw={draw} />
}
