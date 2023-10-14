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

          let color: string
          switch (cell.type) {
            case CellType.Grass1:
              color = 'hsl(121, 67%, 26%)'
              break
            case CellType.Grass2:
              color = 'hsl(121, 67%, 20%)'
              break
            case CellType.Grass3:
              color = 'hsl(121, 67%, 14%)'
              break
            case CellType.WaterDeep:
              color = 'hsl(220, 90%, 32%)'
              break
            case CellType.WaterShallow:
              color = 'hsl(220, 64%, 64%)'
              break
          }

          g.beginFill(color)
          g.drawRect(cellPosition.x, cellPosition.y, 1, 1)

          if (cell.tree) {
            g.beginFill('hsl(121, 67%, 8%)')
            g.drawCircle(cellPosition.x + 0.5, cellPosition.y + 0.5, 0.45)
          }
        }
      }
    }

    setCache((prev) => ({ ...prev, ...newChunks }))
  }, [chunks, visibleChunkIds])

  return Object.entries(cache).map(([chunkId, draw]) => (
    <Graphics key={chunkId} draw={draw} />
  ))
}
