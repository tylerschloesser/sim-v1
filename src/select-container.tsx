import { Graphics } from '@pixi/react'
import * as PIXI from 'pixi.js'
import { useCallback } from 'react'
import { useCamera, useSelect } from './state.js'
import { getCellSize } from './util.js'

export function SelectContainer() {
  const camera = useCamera()
  const select = useSelect()

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear()

      if (!select) return

      const cellSize = getCellSize(camera.zoom)
      g.lineStyle(1 / cellSize, 'pink')
      g.drawRect(select.start.x, select.start.y, 1, 1)

      if (select.end) {
        g.drawRect(select.end.x, select.end.y, 1, 1)

        const size = select.end.sub(select.start)
        g.drawRect(select.start.x, select.start.y, size.x, size.y)
      }
    },
    [select, camera],
  )

  return <Graphics draw={draw} />
}
