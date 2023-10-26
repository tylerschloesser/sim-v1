import Prando from 'prando'
import { NoiseFunction3D, createNoise3D } from 'simplex-noise'
import { CHUNK_SIZE, INITIAL_CLEAR_RADIUS } from './const.js'
import {
  CellType,
  Chunk,
  ChunkId,
  Entity,
  EntityId,
  EntityStateType,
  EntityType,
  TreeEntity,
} from './types.js'
import { chunkIdToPosition, getChunkIds } from './util.js'
import { Vec2 } from './vec2.js'

const INITIAL_CHUNK_RADIUS = 3
const TREE_SIZE = new Vec2(1)

export function generateInitialChunks(): {
  chunks: Record<ChunkId, Chunk>
  entities: Record<EntityId, Entity>
} {
  const chunks: Record<ChunkId, Chunk> = {}
  let entities: Record<EntityId, Entity> = {}

  for (let x = -INITIAL_CHUNK_RADIUS; x < INITIAL_CHUNK_RADIUS; x++) {
    for (let y = -INITIAL_CHUNK_RADIUS; y < INITIAL_CHUNK_RADIUS; y++) {
      const chunkId = `${x}.${y}`
      const result = generateChunk(chunkId)
      chunks[chunkId] = result.chunk
      entities = { ...entities, ...result.entities }
    }
  }

  return { chunks, entities }
}

const rng = new Prando()
const noise3d: NoiseFunction3D = (() => {
  const original = createNoise3D(rng.next.bind(rng))
  return (x: number, y: number, z: number) => {
    const v = original(x, y, z)
    return (v + 1) / 2
  }
})()

export function generateChunk(chunkId: ChunkId): {
  chunk: Chunk
  entities: Record<EntityId, Entity>
} {
  console.debug(`generating chunk ${chunkId}`)

  const chunkPosition = chunkIdToPosition(chunkId)

  const entities: Record<EntityId, Entity> = {}
  const cells: Chunk['cells'] = new Array(CHUNK_SIZE ** 2)

  for (let i = 0; i < cells.length; i++) {
    const cellPosition = chunkPosition.add(
      new Vec2(i % CHUNK_SIZE, i / CHUNK_SIZE).floor(),
    )
    const { x, y } = cellPosition

    let cellType: CellType
    let entityId: undefined | EntityId

    // grass
    {
      let noise = noise3d(x * 0.01, y * 0.01, 10)
      noise = noise + noise3d(x * 0.1, y * 0.1, 20) / 2

      cellType = CellType.Grass3
      if (noise > 0.66) {
        cellType = CellType.Grass1
      } else if (noise > 0.33) {
        cellType = CellType.Grass2
      }
    }

    // water
    {
      let noise = noise3d(x * 0.02, y * 0.02, 30) * 0.85
      noise += noise3d(x * 0.1, y * 0.1, 35) * 0.15

      const dist = cellPosition.dist()
      if (dist < INITIAL_CLEAR_RADIUS) {
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
        let noise = noise3d(x * 0.02, y * 0.02, 40) * 0.7
        noise += noise3d(x * 0.1, y * 0.1, 45) * 0.3

        const dist = cellPosition.dist()
        if (dist < INITIAL_CLEAR_RADIUS) {
          noise = 0
        }

        if (noise > 0.5) {
          noise = (noise - 0.5) * 2

          if (noise * noise3d(x * 1, y * 1, 50) > 0.2) {
            const tree: TreeEntity = {
              id: `${x}.${y}`,
              chunkIds: getChunkIds(cellPosition, TREE_SIZE),
              position: cellPosition,
              size: TREE_SIZE,
              type: EntityType.Tree,
              state: { type: EntityStateType.Active },
            }
            entities[tree.id] = tree
            entityId = tree.id
          }
        }
      }
    }

    cells[i] = { type: cellType, entityId }
  }

  return {
    chunk: {
      id: chunkId,
      position: chunkPosition,
      cells,
    },
    entities,
  }
}
