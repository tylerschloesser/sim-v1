import invariant from 'tiny-invariant'
import { CHUNK_SIZE, MAX_CELL_SIZE, MIN_CELL_SIZE } from './const.js'
import { BoundingBox, Camera, Cell, CellType, Chunk, ChunkId } from './types.js'
import { Vec2 } from './vec2.js'

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function hackPointerEvent(e: PointerEvent) {
  if (e.pointerType === 'touch') {
    // Safari iOS doesn't set pressure for some reason...
    // It's readonly so we need to hack it...
    Object.defineProperty(e, 'pressure', {
      value: 0.5,
    })
  }
  return e
}

export function getCellSize(zoom: number): number {
  return MIN_CELL_SIZE + (MAX_CELL_SIZE - MIN_CELL_SIZE) * zoom
}

export function cellSizeToZoom(cellSize: number): number {
  invariant(cellSize >= MIN_CELL_SIZE)
  invariant(cellSize <= MAX_CELL_SIZE)
  return (cellSize - MIN_CELL_SIZE) / (MAX_CELL_SIZE - MIN_CELL_SIZE)
}

export function screenToWorld({
  screen,
  viewport,
  camera,
}: {
  screen: Vec2
  viewport: Vec2
  camera: Camera
}): Vec2 {
  const cellSize = getCellSize(camera.zoom)
  return screen.sub(viewport.div(2)).div(cellSize).add(camera.position)
}

export function worldToScreen({
  world,
  viewport,
  camera,
}: {
  world: Vec2
  viewport: Vec2
  camera: Camera
}): Vec2 {
  const cellSize = getCellSize(camera.zoom)
  return world.sub(camera.position).mul(cellSize).add(viewport.div(2))
}

export function chunkIdToPosition(chunkId: ChunkId): Vec2 {
  const match = chunkId.match(/(-?\d+)\.(-?\d+)/)
  invariant(match?.length === 3)
  const [x, y] = match.slice(1)
  invariant(x)
  invariant(y)
  return new Vec2(parseInt(x), parseInt(y)).mul(CHUNK_SIZE)
}

export function getChunkId(position: Vec2): ChunkId {
  const chunkPosition = position.div(CHUNK_SIZE).floor()
  const chunkId = `${chunkPosition.x}.${chunkPosition.y}`
  return chunkId
}

export function getChunkIds(position: Vec2, size: Vec2): Set<ChunkId> {
  const chunkIds = new Set<ChunkId>()
  for (let y = 0; y < size.y; y++) {
    for (let x = 0; x < size.x; x++) {
      const chunkId = getChunkId(position.add(new Vec2(x, y)))
      chunkIds.add(chunkId)
    }
  }
  invariant(chunkIds.size > 0)
  if (size.x === 1 && size.y === 1) {
    invariant(chunkIds.size === 1)
  }
  return chunkIds
}

export function getCell(chunks: Record<ChunkId, Chunk>, position: Vec2): Cell {
  const chunkId = getChunkId(position)
  const chunk = chunks[chunkId]
  invariant(chunk)

  const relativePosition = position.mod(CHUNK_SIZE)
  const cellIndex = relativePosition.y * CHUNK_SIZE + relativePosition.x
  const cell = chunk.cells[cellIndex]
  invariant(cell)

  return cell
}

export function canBuild(cell: Cell): boolean {
  if (cell.entityId) return false
  return [CellType.Grass1, CellType.Grass2, CellType.Grass3].includes(cell.type)
}

export function getCellBoundingBox(a: Vec2, b: Vec2): BoundingBox {
  const tl = new Vec2(Math.min(a.x, b.x), Math.min(a.y, b.y))
  const br = new Vec2(Math.max(a.x, b.x), Math.max(a.y, b.y))
  return { tl, br }
}

let nextJobId = 0
export function getNextJobId() {
  return `${nextJobId++}`
}

export function isEqual<T>(a: T, b: T) {
  if (a === b) return true
  if (a === null || b === null) return false

  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false
    return [...a].every((v) => b.has(v))
  }

  invariant(false, 'unsupported isEqual')
}
