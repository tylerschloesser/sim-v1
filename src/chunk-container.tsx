import * as PIXI from 'pixi.js'
import { Container, Graphics } from '@pixi/react'
import {
  CellType,
  useCamera,
  useChunks,
  useViewport,
  useVisibleChunkIds,
} from './state.js'
import { useCallback } from 'react'
import { CHUNK_SIZE } from './const.js'
import { Vec2 } from './vec2.js'
import invariant from 'tiny-invariant'
import { getCellSize } from './util.js'

export function ChunkContainer() {
  const chunks = useChunks()
  const visibleChunkIds = useVisibleChunkIds()
  const camera = useCamera()
  const viewport = useViewport()

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear()

      for (const chunkId of visibleChunkIds) {
        const chunk = chunks[chunkId]

        if (!chunk) continue

        for (let i = 0; i < chunk.cells.length; i++) {
          const cellPosition = new Vec2(i % CHUNK_SIZE, i / CHUNK_SIZE)
            .floor()
            .add(chunk.position)
          const cell = chunk.cells[i]
          invariant(cell)
          g.beginFill(cell.type === CellType.Grass ? 'green' : 'blue')
          g.drawRect(cellPosition.x, cellPosition.y, 1, 1)
        }
      }
    },
    [chunks, visibleChunkIds],
  )

  const cellSize = getCellSize(camera.zoom)

  return (
    <Container
      position={camera.position.mul(cellSize * -1).add(viewport.div(2))}
      scale={cellSize}
    >
      <Graphics draw={draw} />
    </Container>
  )
}
