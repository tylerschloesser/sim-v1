import { createNoise3D } from 'simplex-noise'
import { CHUNK_SIZE } from './const.js'
import { CellType, Chunk, ChunkId } from './types.js'
import { chunkIdToPosition } from './util.js'
import { Vec2 } from './vec2.js'

const noise3d = createNoise3D()

const scale = {
  x: 0.05,
  y: 0.05,
  z: 1,
}

export function generateChunk(chunkId: ChunkId): Chunk {
  console.debug(`generating chunk ${chunkId}`)

  const chunkPosition = chunkIdToPosition(chunkId)

  const cells: Chunk['cells'] = new Array(CHUNK_SIZE ** 2)
  for (let i = 0; i < cells.length; i++) {
    const cellPosition = new Vec2(i % CHUNK_SIZE, i / CHUNK_SIZE).floor()

    const { x, y } = chunkPosition.add(cellPosition)
    const z = 1
    const noise = noise3d(x * scale.x, y * scale.y, z * scale.z)

    cells[i] = {
      type: noise < 0.5 ? CellType.Grass : CellType.Water,
    }
  }

  return {
    id: chunkId,
    position: chunkPosition,
    cells,
  }
}
