import { createNoise3D } from 'simplex-noise'
import { CHUNK_SIZE } from './const.js'
import { CellType, Chunk, ChunkId } from './types.js'
import { chunkIdToPosition } from './util.js'
import { Vec2 } from './vec2.js'
import invariant from 'tiny-invariant'
import Prando from 'prando'

const scale = {
  x: 0.05,
  y: 0.05,
  z: 1,
}

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
    cell.type = CellType.Grass
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

  for (let x = -1; x < 1; x++) {
    for (let y = -1; y < 1; y++) {
      const chunkId = `${x}.${y}`
      removeWater({ chunkId, chunks })
    }
  }

  return chunks
}

const rng = new Prando()
const noise3d = createNoise3D(rng.next.bind(rng))

export function generateChunk(chunkId: ChunkId): Chunk {
  console.debug(`generating chunk ${chunkId}`)

  const chunkPosition = chunkIdToPosition(chunkId)

  const cells: Chunk['cells'] = new Array(CHUNK_SIZE ** 2)
  for (let i = 0; i < cells.length; i++) {
    const cellPosition = new Vec2(i % CHUNK_SIZE, i / CHUNK_SIZE).floor()

    const { x, y } = chunkPosition.add(cellPosition)
    const z = 1
    const noise = noise3d(x * scale.x, y * scale.y, z * scale.z)

    let cellType: CellType
    if (noise > 0.5) {
      cellType = CellType.WaterDeep
    } else if (noise > 0.3) {
      cellType = CellType.WaterShallow
    } else {
      cellType = CellType.Grass
    }

    cells[i] = { type: cellType }
  }

  return {
    id: chunkId,
    position: chunkPosition,
    cells,
  }
}
