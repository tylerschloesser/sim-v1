import { Graphics } from '@pixi/react'
import * as PIXI from 'pixi.js'
import { useCallback } from 'react'
import { useCamera, useViewport } from './state.js'
import { getCellSize } from './util.js'

export function GridContainer() {
  const camera = useCamera()
  const viewport = useViewport()

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      const cellSize = getCellSize(camera.zoom)

      g.clear()

      g.lineStyle({
        width: 1 / cellSize,
        color: '0x111',
      })

      let topLeft = camera.position.sub(viewport.div(2).div(cellSize))
      let bottomRight = topLeft.add(viewport.div(cellSize))

      topLeft = topLeft.floor()
      bottomRight = bottomRight.ceil()

      for (let x = topLeft.x; x <= bottomRight.x; x++) {
        g.moveTo(x, topLeft.y)
        g.lineTo(x, bottomRight.y)
      }

      for (let y = topLeft.y; y <= bottomRight.y; y++) {
        g.moveTo(topLeft.x, y)
        g.lineTo(bottomRight.x, y)
      }
    },
    [viewport, camera],
  )

  return <Graphics draw={draw} />
}
