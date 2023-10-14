import { CHUNK_SIZE } from './const.js'
import { CellType, Chunk, ChunkId } from './types.js'
import { chunkIdToPosition } from './util.js'

export function generateChunk(chunkId: ChunkId): Chunk {
  console.debug(`generating chunk ${chunkId}`)

  const cells: Chunk['cells'] = new Array(CHUNK_SIZE ** 2)
  for (let i = 0; i < cells.length; i++) {
    cells[i] = {
      type: Math.random() < 0.8 ? CellType.Grass : CellType.Water,
    }
  }

  return {
    id: chunkId,
    position: chunkIdToPosition(chunkId),
    cells,
  }
}
