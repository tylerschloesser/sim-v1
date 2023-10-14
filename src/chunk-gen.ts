import { NoiseFunction3D, createNoise3D } from 'simplex-noise'
import { CHUNK_SIZE } from './const.js'
import { CellType, Chunk, ChunkId } from './types.js'
import { chunkIdToPosition } from './util.js'
import { Vec2 } from './vec2.js'
import invariant from 'tiny-invariant'
import Prando from 'prando'

const INITIAL_CHUNK_RADIUS = 3

function removeWater({
  chunkId,
  chunks,
}: {
  chunkId: ChunkId
  chunks: Record<ChunkId, Chunk>
}) {
  const chunk = chunks[chunkId]
  invariant(chunk)

  for (let i = 0; i < chunk.cells.length; i++) {
    const cell = chunk.cells[i]
    invariant(cell)
    cell.type = CellType.Grass1
  }
}

export function generateInitialChunks(): Record<ChunkId, Chunk> {
  const chunks: Record<ChunkId, Chunk> = {}

  for (let x = -INITIAL_CHUNK_RADIUS; x < INITIAL_CHUNK_RADIUS; x++) {
    for (let y = -INITIAL_CHUNK_RADIUS; y < INITIAL_CHUNK_RADIUS; y++) {
      const chunkId = `${x}.${y}`
      chunks[chunkId] = generateChunk(chunkId)
    }
  }

  // for (let x = -1; x < 1; x++) {
  //   for (let y = -1; y < 1; y++) {
  //     const chunkId = `${x}.${y}`
  //     removeWater({ chunkId, chunks })
  //   }
  // }

  return chunks
}

const rng = new Prando()
const noise3d = (() => {
  const original = createNoise3D(rng.next.bind(rng))
  return (
    x: number,
    y: number,
    z: number,
    scale: { x: number; y: number; z: number } = { x: 1, y: 1, z: 1 },
  ) => {
    const v = original(x * scale.x, y * scale.y, z * scale.z)
    return (v + 1) / 2
  }
})()

export function generateChunk(chunkId: ChunkId): Chunk {
  console.debug(`generating chunk ${chunkId}`)

  const chunkPosition = chunkIdToPosition(chunkId)

  const cells: Chunk['cells'] = new Array(CHUNK_SIZE ** 2)
  for (let i = 0; i < cells.length; i++) {
    const cellPosition = new Vec2(i % CHUNK_SIZE, i / CHUNK_SIZE).floor()

    const { x, y } = chunkPosition.add(cellPosition)
    const z = 1

    let cellType: CellType

    // grass
    {
      const scale = {
        x: 0.05,
        y: 0.05,
        z: 1,
      }
      const noise = noise3d(x, y, z, scale)
      if (noise > 0.66) {
        cellType = CellType.Grass1
      } else if (noise > 0.33) {
        cellType = CellType.Grass2
      } else {
        cellType = CellType.Grass3
      }
    }

    // water
    {
      const scale = {
        x: 0.05,
        y: 0.05,
        z: 2,
      }
      const noise = noise3d(x, y, z, scale)
      if (noise > 0.8) {
        cellType = CellType.WaterDeep
      } else if (noise > 0.7) {
        cellType = CellType.WaterShallow
      }
    }

    cells[i] = { type: cellType }
  }

  return {
    id: chunkId,
    position: chunkPosition,
    cells,
  }
}
