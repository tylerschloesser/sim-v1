import { Graphics } from '@pixi/react'
import * as PIXI from 'pixi.js'
import { useCallback } from 'react'
import invariant from 'tiny-invariant'
import { CHUNK_SIZE } from './const.js'
import { CellType, useChunks, useVisibleChunkIds } from './state.js'
import { Vec2 } from './vec2.js'

export function ChunkContainer() {
  const chunks = useChunks()
  const visibleChunkIds = useVisibleChunkIds()

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

  return <Graphics draw={draw} />
}
