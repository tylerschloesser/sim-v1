import { Graphics } from '@pixi/react'
import * as PIXI from 'pixi.js'
import { useCallback } from 'react'
import { useCamera, useHover, useSelect, useViewport } from './state.js'
import { getCellSize, worldToScreen } from './util.js'

export function HoverContainer() {
  const hover = useHover()
  const viewport = useViewport()
  const camera = useCamera()
  const cellSize = getCellSize(camera.zoom)
  const select = useSelect()

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear()
      g.lineStyle(2, 'red')
      g.drawRect(0, 0, cellSize, cellSize)
    },
    [cellSize],
  )

  if (hover === null) return null
  if (select !== null) return null

  return (
    <Graphics
      draw={draw}
      position={worldToScreen({
        world: hover.floor(),
        camera,
        viewport,
      })}
    />
  )
}
