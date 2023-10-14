import { Graphics } from '@pixi/react'
import * as PIXI from 'pixi.js'
import { useEffect, useState } from 'react'
import invariant from 'tiny-invariant'
import { CHUNK_SIZE } from './const.js'
import { useChunks, useVisibleChunkIds } from './state.js'
import { Vec2 } from './vec2.js'
import { CellType, ChunkId } from './types.js'

type DrawFn = (g: PIXI.Graphics) => void

export function ChunkContainer() {
  const chunks = useChunks()
  const visibleChunkIds = useVisibleChunkIds()

  const [cache, setCache] = useState<Record<ChunkId, DrawFn>>({})

  useEffect(() => {
    const newChunks: Record<ChunkId, DrawFn> = {}

    for (const chunkId of visibleChunkIds) {
      // TODO this won't re-render if the chunk changes
      if (cache[chunkId]) {
        continue
      }
      newChunks[chunkId] = (g) => {
        g.clear()

        const chunk = chunks[chunkId]
        if (!chunk) return

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
    }

    setCache((prev) => ({ ...prev, ...newChunks }))
  }, [chunks, visibleChunkIds])

  return Object.entries(cache).map(([chunkId, draw]) => (
    <Graphics key={chunkId} draw={draw} />
  ))
}
