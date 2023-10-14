import Prando from 'prando'
import { NoiseFunction3D, createNoise3D } from 'simplex-noise'
import { CHUNK_SIZE } from './const.js'
import { CellType, Chunk, ChunkId } from './types.js'
import { chunkIdToPosition } from './util.js'
import { Vec2 } from './vec2.js'

const INITIAL_CHUNK_RADIUS = 3

export function generateInitialChunks(): Record<ChunkId, Chunk> {
  const chunks: Record<ChunkId, Chunk> = {}

  for (let x = -INITIAL_CHUNK_RADIUS; x < INITIAL_CHUNK_RADIUS; x++) {
    for (let y = -INITIAL_CHUNK_RADIUS; y < INITIAL_CHUNK_RADIUS; y++) {
      const chunkId = `${x}.${y}`
      chunks[chunkId] = generateChunk(chunkId)
    }
  }

  return chunks
}

const rng = new Prando()
const noise3d: NoiseFunction3D = (() => {
  const original = createNoise3D(rng.next.bind(rng))
  return (x: number, y: number, z: number) => {
    const v = original(x, y, z)
    return (v + 1) / 2
  }
})()

export function generateChunk(chunkId: ChunkId): Chunk {
  console.debug(`generating chunk ${chunkId}`)

  const chunkPosition = chunkIdToPosition(chunkId)

  const cells: Chunk['cells'] = new Array(CHUNK_SIZE ** 2)
  for (let i = 0; i < cells.length; i++) {
    const cellPosition = chunkPosition.add(
      new Vec2(i % CHUNK_SIZE, i / CHUNK_SIZE).floor(),
    )
    const { x, y } = cellPosition

    let cellType: CellType
    let tree: undefined | true

    // grass
    {
      const scale = 0.01
      cellType = CellType.Grass1
      if (noise3d(x * scale, y * scale, 10) > 0.5) {
        cellType = CellType.Grass2
      } else if (noise3d(x * scale, y * scale, 20) > 0.5) {
        cellType = CellType.Grass3
      }
    }

    // water
    {
      const scale = 0.02
      let noise = noise3d(x * scale, y * scale, 30)

      const dist = cellPosition.dist()
      if (dist < CHUNK_SIZE) {
        noise = 0
      }

      if (noise > 0.8) {
        cellType = CellType.WaterDeep
      } else if (noise > 0.7) {
        cellType = CellType.WaterShallow
      }
    }

    // tree
    {
      if (
        [CellType.Grass1, CellType.Grass2, CellType.Grass3].includes(cellType)
      ) {
        let scale = 0.03
        let noise = noise3d(x * scale, y * scale, 40)

        const dist = cellPosition.dist()
        if (dist < CHUNK_SIZE) {
          noise = 0
        }

        if (noise > 0.5) {
          noise = (noise - 0.5) * 2

          if (noise * noise3d(x * 1, y * 1, 50) > 0.2) {
            tree = true
          }
        }
      }
    }

    cells[i] = { type: cellType, tree }
  }

  return {
    id: chunkId,
    position: chunkPosition,
    cells,
  }
}
