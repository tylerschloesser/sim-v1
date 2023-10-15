import { bind } from '@react-rxjs/core'
import { createSignal } from '@react-rxjs/utils'
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  distinctUntilChanged,
  map,
  pairwise,
  startWith,
} from 'rxjs'
import { generateChunk, generateInitialChunks } from './chunk-gen.js'
import {
  CHUNK_SIZE,
  INITIAL_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  WHEEL_SCALE,
} from './const.js'
import {
  Agent,
  AgentId,
  BuildState,
  Camera,
  Chunk,
  ChunkId,
  Config,
  Entity,
  EntityId,
  EntityType,
  PointerMode,
  Select,
} from './types.js'
import {
  canBuild,
  clamp,
  getCell,
  getCellSize,
  isEqual,
  screenToWorld,
} from './util.js'
import { Vec2 } from './vec2.js'
import invariant from 'tiny-invariant'

export const keyboard$ = new Subject<KeyboardEvent>()
export const pointer$ = new Subject<PointerEvent>()
export const wheel$ = new Subject<WheelEvent>()
export const viewport$ = new BehaviorSubject<Vec2>(new Vec2())
export const blur$ = new Subject<void>()
export const camera$ = new BehaviorSubject<Camera>({
  position: new Vec2(),
  zoom: INITIAL_ZOOM,
})
export const select$ = new BehaviorSubject<Select | null>(null)
export const [useSelection] = bind(select$)
export const pointerMode$ = new BehaviorSubject<PointerMode>(PointerMode.Move)

export const [buildEntityType$, setBuildEntityType] =
  createSignal<EntityType | null>()

export const [confirmBuild$, confirmBuild] = createSignal<BuildState>()

export const build$ = new BehaviorSubject<BuildState | null>(null)
export const [useBuild] = bind(build$)

export const config$ = new BehaviorSubject<Config>({
  showGrid: false,
})
export const [useConfig] = bind(config$)

keyboard$.subscribe((e) => {
  switch (e.type) {
    case 'keyup': {
      if (e.key === 'g') {
        config$.next({
          ...config$.value,
          showGrid: !config$.value.showGrid,
        })
      }
      if (e.key === 'Shift') {
        pointerMode$.next(PointerMode.Move)
      }
      break
    }
    case 'keydown': {
      if (e.key === 'Shift') {
        pointerMode$.next(PointerMode.Select)
      }
      break
    }
  }
})

blur$.subscribe(() => {
  pointerMode$.next(PointerMode.Move)
})

export const entities$ = new BehaviorSubject<Record<EntityId, Entity>>({})
export const [useEntities] = bind(entities$)

export const chunks$ = new BehaviorSubject<Record<ChunkId, Chunk>>(
  generateInitialChunks(),
)
export const [useChunks] = bind(chunks$)

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
export const [useVisibleChunkIds] = bind(visibleChunkIds$)

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

combineLatest([pointer$.pipe(pairwise()), pointerMode$]).subscribe(
  ([[prev, next], mode]) => {
    if (next.type === 'pointermove' && next.pressure > 0) {
      if (mode === PointerMode.Move) {
        const { zoom, position } = camera$.value
        const cellSize = getCellSize(zoom)

        const delta = new Vec2(next).sub(new Vec2(prev)).mul(-1).div(cellSize)

        camera$.next({
          position: position.add(delta),
          zoom,
        })
      } else {
        invariant(mode === PointerMode.Select)

        const cellPosition = screenToWorld({
          screen: new Vec2(next),
          camera: camera$.value,
          viewport: viewport$.value,
        }).floor()

        if (select$.value === null) {
          select$.next({
            start: cellPosition,
          })
        } else {
          select$.next({
            start: select$.value.start,
            end: cellPosition,
          })
        }
      }
    } else if (next.type === 'pointerup') {
      select$.next(null)
    }
  },
)

wheel$.subscribe((e) => {
  const zoom = {
    prev: camera$.value.zoom,
    next: clamp(
      camera$.value.zoom + e.deltaY / -WHEEL_SCALE,
      MIN_ZOOM,
      MAX_ZOOM,
    ),
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

combineLatest([buildEntityType$, camera$, chunks$]).subscribe(
  ([entityType, camera, chunks]) => {
    if (entityType === null) {
      build$.next(null)
      return
    }

    const size = new Vec2(2)
    const buildPosition = camera.position.sub(size.div(2)).round()

    let valid = true

    for (let x = 0; x < size.x && valid; x++) {
      for (let y = 0; y < size.y && valid; y++) {
        const cellPosition = buildPosition.add(new Vec2(x, y))
        const cell = getCell(chunks, cellPosition)
        valid = canBuild(cell)
      }
    }

    build$.next({
      position: buildPosition,
      size,
      entityType,
      valid,
    })
  },
)

confirmBuild$.subscribe((build) => {
  let entity: Entity
  switch (build.entityType) {
    case EntityType.House:
      entity = {
        id: `entity.${build.position.x}.${build.position.y}`,
        type: EntityType.House,
        position: build.position,
        size: build.size,
      }
      break
  }

  entities$.next({
    ...entities$.value,
    [entity.id]: entity,
  })

  const chunks = chunks$.value

  for (let x = 0; x < entity.size.x; x++) {
    for (let y = 0; y < entity.size.y; y++) {
      const cell = getCell(chunks, entity.position.add(new Vec2(x, y)))
      cell.entityId = entity.id
    }
  }

  chunks$.next({ ...chunks })
})

export const agents$ = new BehaviorSubject<Record<AgentId, Agent>>({
  '0': {
    id: '0',
    position: new Vec2(0, 0),
  },
})
export const [useAgents] = bind(agents$)
