import {
  BehaviorSubject,
  Subject,
  combineLatest,
  distinctUntilChanged,
  map,
  pairwise,
  startWith,
} from 'rxjs'
import { CHUNK_SIZE, MAX_ZOOM, MIN_ZOOM } from './const.js'
import { clamp, getCellSize, isEqual, screenToWorld } from './util.js'
import { Vec2 } from './vec2.js'
import { bind } from '@react-rxjs/core'

export interface Camera {
  position: Vec2
  zoom: number
}

export enum CellType {
  Grass = 'grass',
  Water = 'water',
}

export interface Cell {
  type: CellType
}

export type ChunkId = string
export interface Chunk {
  id: ChunkId
  cells: Cell[]
}

export const pointer$ = new Subject<PointerEvent>()
export const wheel$ = new Subject<WheelEvent>()
export const viewport$ = new BehaviorSubject<Vec2>(new Vec2())
export const camera$ = new BehaviorSubject<Camera>({
  position: new Vec2(),
  zoom: 0.5,
})

export const chunks$ = new BehaviorSubject<Record<ChunkId, Chunk>>({})

const visibleChunkIds$ = combineLatest([camera$, viewport$]).pipe(
  map(([camera, viewport]) => {
    const visibleChunkIds = new Set<ChunkId>()

    const cellSize = getCellSize(camera.zoom)
    let topLeft = camera.position
      .sub(viewport.div(2).div(cellSize))
      .div(CHUNK_SIZE)

    let bottomRight = topLeft.add(viewport.div(cellSize).div(CHUNK_SIZE))

    topLeft = topLeft.floor()
    bottomRight = bottomRight.floor()

    for (let x = topLeft.x; x <= bottomRight.x; x++) {
      for (let y = topLeft.y; y <= bottomRight.y; y++) {
        visibleChunkIds.add(`${x}.${y}`)
      }
    }

    return visibleChunkIds
  }),
  distinctUntilChanged(isEqual),
)

visibleChunkIds$.subscribe((visibleChunkIds) => {
  console.log(visibleChunkIds)
})

export const visibleChunks$ = combineLatest([chunks$, visibleChunkIds$]).pipe(
  map(([chunks, visibleChunkIds]) => {
    const visibleChunks: Record<ChunkId, Chunk> = {}
    for (const chunkId of visibleChunkIds) {
      const chunk = chunks[chunkId]
      if (chunk) {
        visibleChunks[chunkId] = chunk
      }
    }
  }),
)

function generateChunk(chunkId: ChunkId): Chunk {
  console.debug(`generating chunk ${chunkId}`)
  return {
    id: chunkId,
    cells: new Array<Cell>(CHUNK_SIZE ** 2).fill({
      type: CellType.Grass,
    }),
  }
}

visibleChunkIds$.subscribe((visibleChunkIds) => {
  const chunks = chunks$.value
  const newChunks: Record<ChunkId, Chunk> = {}

  for (const chunkId of visibleChunkIds) {
    if (!chunks[chunkId]) {
      newChunks[chunkId] = generateChunk(chunkId)
    }
  }

  if (Object.keys(newChunks).length > 0) {
    chunks$.next({ ...chunks, ...newChunks })
  }
})

export const hover$ = combineLatest([pointer$, viewport$, camera$]).pipe(
  map(([pointer, viewport, camera]) => {
    if (pointer.type === 'pointerleave' || pointer.type === 'pointerout') {
      return null
    }

    return screenToWorld({
      screen: new Vec2(pointer),
      viewport,
      camera,
    })
  }),
  startWith(null),
)

export const [useCamera] = bind(camera$)
export const [useViewport] = bind(viewport$)
export const [useHover] = bind(hover$)

pointer$.pipe(pairwise()).subscribe(([prev, next]) => {
  if (next.type === 'pointermove' && next.pressure > 0) {
    const { zoom, position } = camera$.value
    const cellSize = getCellSize(zoom)

    const delta = new Vec2(next).sub(new Vec2(prev)).mul(-1).div(cellSize)

    camera$.next({
      position: position.add(delta),
      zoom,
    })
  }
})

wheel$.subscribe((e) => {
  const zoom = {
    prev: camera$.value.zoom,
    next: clamp(camera$.value.zoom + e.deltaY / -1000, MIN_ZOOM, MAX_ZOOM),
  }

  if (zoom.prev === zoom.next) {
    camera$.next({
      position: camera$.value.position,
      zoom: zoom.next,
    })
    return
  }

  const anchor = new Vec2(e).sub(viewport$.value.div(2))
  const adjust = anchor
    .div(getCellSize(zoom.prev))
    .sub(anchor.div(getCellSize(zoom.next)))

  camera$.next({
    position: camera$.value.position.add(adjust),
    zoom: zoom.next,
  })
})
