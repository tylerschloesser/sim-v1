import { Graphics } from '@pixi/react'
import * as PIXI from 'pixi.js'
import { useCallback } from 'react'
import { useCamera, useSelect } from './state.js'
import { getCellBoundingBox, getCellSize } from './util.js'

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

        const bb = getCellBoundingBox(select.start, select.end)
        const size = bb.br.sub(bb.tl).add(1)
        g.drawRect(bb.tl.x, bb.tl.y, size.x, size.y)
      }
    },
    [select, camera],
  )

  return <Graphics draw={draw} />
}
