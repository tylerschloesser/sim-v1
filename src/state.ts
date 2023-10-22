import { bind } from '@react-rxjs/core'
import { createSignal } from '@react-rxjs/utils'
import { NavigateFunction } from 'react-router-dom'
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  distinctUntilChanged,
  map,
  pairwise,
  skip,
  startWith,
  withLatestFrom,
} from 'rxjs'
import invariant from 'tiny-invariant'
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
  EntityStateType,
  EntityType,
  FarmCell,
  ItemType,
  Job,
  JobId,
  JobType,
  PointerMode,
  Select,
  WorldUpdates,
  ZoomLevel,
} from './types.js'
import {
  canBuild,
  clamp,
  getCell,
  getCellBoundingBox,
  getCellSize,
  getChunkId,
  getNextJobId,
  isEqual,
  screenToWorld,
} from './util.js'
import { Vec2 } from './vec2.js'
import { Graphics } from './graphics.js'

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
export const [useSelect] = bind(select$)
export const pointerMode$ = new BehaviorSubject<PointerMode>(PointerMode.Move)

export const [buildEntityType$, setBuildEntityType] =
  createSignal<EntityType | null>()

export const [confirmBuild$, confirmBuild] = createSignal<BuildState>()

export const navigate$ = new BehaviorSubject<NavigateFunction | null>(null)

export const build$ = new BehaviorSubject<BuildState | null>(null)
export const [useBuild] = bind(build$)

export const [graphics$, setGraphics] = createSignal<Graphics>()

const newEntity$ = new Subject<EntityId>()

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
        select$.next(null)
        pointerMode$.next(PointerMode.Select)
      }
      break
    }
  }
})

blur$.subscribe(() => {
  pointerMode$.next(PointerMode.Move)
})

const { chunks: initialChunks, entities: initialEntities } =
  generateInitialChunks()

export const entities$ = new BehaviorSubject<Record<EntityId, Entity>>(
  initialEntities,
)
export const [useEntities] = bind(entities$)

export const chunks$ = new BehaviorSubject<Record<ChunkId, Chunk>>(
  initialChunks,
)
export const [useChunks] = bind(chunks$)

export const chunkUpdates$ = new Subject<Set<ChunkId>>()
export const entityUpdates$ = new Subject<Set<EntityId>>()

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

const zoomLevel$ = camera$.pipe(
  map((camera) => {
    if (camera.zoom < 0.1) {
      return ZoomLevel.Low
    }
    return ZoomLevel.High
  }),
  distinctUntilChanged(),
)

chunkUpdates$
  .pipe(withLatestFrom(graphics$, visibleChunkIds$, zoomLevel$))
  .subscribe(([chunkUpdates, graphics, visibleChunkIds, zoomLevel]) => {
    const entities = entities$.value
    for (const chunkId of chunkUpdates) {
      const visible = visibleChunkIds.has(chunkId)
      const chunk = chunks$.value[chunkId]
      invariant(chunk)
      graphics.updateLowResEntities({
        chunk,
        entities,
        visible: visible && zoomLevel === ZoomLevel.Low,
      })
    }
  })

entityUpdates$
  .pipe(withLatestFrom(graphics$, visibleChunkIds$, zoomLevel$))
  .subscribe(([entityUpdates, graphics, visibleChunkIds, zoomLevel]) => {
    const visible = zoomLevel === ZoomLevel.High

    for (const entityId of entityUpdates) {
      const entity = entities$.value[entityId]

      if (!entity) {
        graphics.destroyEntity(entityId)
        continue
      }

      graphics.updateEntity(
        entity,
        visible && visibleChunkIds.has(entity.chunkId),
      )
    }
  })

visibleChunkIds$.subscribe((visibleChunkIds) => {
  const chunks = chunks$.value
  const newChunks: Record<ChunkId, Chunk> = {}
  let newEntities: Record<EntityId, Entity> = {}

  for (const chunkId of visibleChunkIds) {
    if (!chunks[chunkId]) {
      const result = generateChunk(chunkId)
      newChunks[chunkId] = result.chunk
      newEntities = { ...newEntities, ...result.entities }
    }
  }

  if (Object.keys(newChunks).length > 0) {
    chunks$.next({ ...chunks, ...newChunks })
  }

  if (Object.keys(newEntities).length > 0) {
    entities$.next({
      ...entities$.value,
      ...newEntities,
    })
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
    switch (next.type) {
      case 'pointermove': {
        if (next.pressure === 0) return

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

        break
      }
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

    let size: Vec2
    switch (entityType) {
      case EntityType.Farm:
        size = new Vec2(4)
        break
      case EntityType.House:
        size = new Vec2(2)
        break
      default:
        invariant(false, `invalid entity type: ${entityType}`)
    }

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

  const entityId: EntityId = `entity.${build.position.x}.${build.position.y}`
  const chunkId = getChunkId(build.position)

  switch (build.entityType) {
    case EntityType.House:
      entity = {
        id: entityId,
        chunkId,
        type: EntityType.House,
        position: build.position,
        size: build.size,
        state: {
          type: EntityStateType.Build,
          materials: {
            [ItemType.Wood]: 2,
          },
        },
      }
      break
    case EntityType.Farm: {
      const cells: FarmCell[] = []
      for (let y = 0; y < build.size.y; y++) {
        for (let x = 0; x < build.size.x; x++) {
          cells.push({
            maturity: 0,
            water: 0,
          })
        }
      }

      entity = {
        id: entityId,
        chunkId,
        type: EntityType.Farm,
        position: build.position,
        size: build.size,
        state: {
          type: EntityStateType.Build,
          materials: {
            [ItemType.Wood]: 8,
          },
        },
        cells,
        pickJobId: null,
      }
      break
    }
    case EntityType.Tree:
      invariant(false, `cannot build ${build.entityType}`)
    case EntityType.Storage: {
      entity = {
        id: entityId,
        chunkId,
        type: EntityType.Storage,
        position: build.position,
        size: build.size,
        state: {
          type: EntityStateType.Build,
          materials: {
            [ItemType.Wood]: 20,
          },
        },
        inventory: {},
      }
      break
    }
  }

  if (build.force) {
    entity.state = { type: EntityStateType.Active }
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

  if (!build.force) {
    const jobId = getNextJobId()
    jobs$.next({
      ...jobs$.value,
      [jobId]: {
        id: jobId,
        type: JobType.Build,
        entityId: entity.id,
      },
    })
  }

  chunkUpdates$.next(new Set([chunkId]))
  entityUpdates$.next(new Set([entityId]))

  newEntity$.next(entityId)
})

export const agents$ = new BehaviorSubject<Record<AgentId, Agent>>({
  '0': {
    id: '0',
    position: new Vec2(0, 0),
    inventory: {},
    energy: 1,
    home: null,
  },
})
export const [useAgents] = bind(agents$)

const selectedEntityIds$ = combineLatest([select$, chunks$]).pipe(
  map(([select, chunks]) => {
    if (select === null || !select.end) {
      return null
    }

    const entityIds = new Set<EntityId>()

    const bb = getCellBoundingBox(select.start, select.end)
    for (let y = bb.tl.y; y <= bb.br.y; y++) {
      for (let x = bb.tl.x; x <= bb.br.x; x++) {
        const cell = getCell(chunks, new Vec2(x, y))
        if (cell.entityId) {
          entityIds.add(cell.entityId)
        }
      }
    }

    return entityIds
  }),
  distinctUntilChanged(isEqual),
)

export const [useSelectedEntityIds] = bind(selectedEntityIds$)

export const jobs$ = new BehaviorSubject<Record<JobId, Job>>({})

combineLatest([graphics$, camera$, viewport$]).subscribe(
  ([graphics, camera, viewport]) => {
    const cellSize = getCellSize(camera.zoom)
    graphics.transformWorld({
      translate: camera.position.mul(cellSize * -1).add(viewport.div(2)),
      scale: cellSize,
    })
  },
)

const updatedChunkIds$ = visibleChunkIds$.pipe(
  distinctUntilChanged(isEqual),
  startWith(null),
  pairwise(),
  map(([prev, next]) => {
    invariant(next)
    if (prev === null) {
      return {
        hide: new Set<ChunkId>(),
        show: next,
      }
    }

    let show = new Set<ChunkId>()
    let hide = new Set<ChunkId>()

    for (const chunkId of prev) {
      if (!next.has(chunkId)) {
        hide.add(chunkId)
      }
    }
    for (const chunkId of next) {
      if (!prev.has(chunkId)) {
        show.add(chunkId)
      }
    }

    return { show, hide }
  }),
)

combineLatest([graphics$, updatedChunkIds$])
  .pipe(withLatestFrom(chunks$))
  .subscribe(([[graphics, updatedChunkIds], chunks]) => {
    for (const chunkId of updatedChunkIds.show) {
      const chunk = chunks[chunkId]
      invariant(chunk)
      graphics.renderChunk({ chunk })
    }
    for (const chunkId of updatedChunkIds.hide) {
      const chunk = chunks[chunkId]
      invariant(chunk)
      graphics.hideChunk({ chunk })
    }
  })

combineLatest([graphics$, updatedChunkIds$])
  .pipe(withLatestFrom(chunks$, entities$, zoomLevel$))
  .subscribe(([[graphics, updatedChunkIds], chunks, entities, zoomLevel]) => {
    if (zoomLevel === ZoomLevel.High) {
      return
    }

    for (const chunkId of updatedChunkIds.show) {
      const chunk = chunks[chunkId]
      invariant(chunk)
      graphics.renderLowResEntities({ chunk, entities })
    }

    for (const chunkId of updatedChunkIds.hide) {
      const chunk = chunks[chunkId]
      invariant(chunk)
      graphics.hideLowResEntities({ chunk })
    }
  })

combineLatest([graphics$, zoomLevel$])
  .pipe(
    withLatestFrom(visibleChunkIds$, chunks$, entities$),
    // zoomLevel is handled during normal render path,
    // so only need to do this when it changes
    skip(1),
  )
  .subscribe(([[graphics, zoomLevel], visibleChunkIds, chunks, entities]) => {
    for (const chunkId of visibleChunkIds) {
      const chunk = chunks[chunkId]
      invariant(chunk)
      if (zoomLevel === ZoomLevel.Low) {
        graphics.renderLowResEntities({ chunk, entities })
      } else {
        graphics.hideLowResEntities({ chunk })
      }
    }
  })

combineLatest([graphics$, updatedChunkIds$])
  .pipe(withLatestFrom(entities$, zoomLevel$))
  .subscribe(([[graphics, updatedChunkIds], entities, zoomLevel]) => {
    if (zoomLevel === ZoomLevel.Low) {
      return
    }

    for (const entity of Object.values(entities)) {
      if (updatedChunkIds.show.has(entity.chunkId)) {
        graphics.renderEntity(entity)
      } else if (updatedChunkIds.hide.has(entity.chunkId)) {
        graphics.hideEntity(entity)
      }
    }
  })

zoomLevel$
  .pipe(withLatestFrom(graphics$))
  .subscribe(([zoomLevel, graphics]) => {
    graphics.updateZoomLevel(zoomLevel)
  })

combineLatest([graphics$, zoomLevel$])
  .pipe(withLatestFrom(visibleChunkIds$, chunks$, entities$))
  .subscribe(([[graphics, zoomLevel], visibleChunkIds, chunks, entities]) => {
    if (zoomLevel === ZoomLevel.Low) {
      return
    }

    for (const chunkId of visibleChunkIds) {
      const chunk = chunks[chunkId]
      invariant(chunk)
      for (const entityId of chunk.cells
        .map((cell) => cell.entityId)
        .filter((entityId): entityId is EntityId => !!entityId)) {
        const entity = entities[entityId]
        invariant(entity)
        graphics.renderEntity(entity)
      }
    }
  })

export const updates$ = new Subject<WorldUpdates>()
export const agentUpdates$ = new Subject<Set<AgentId>>()

agentUpdates$
  .pipe(withLatestFrom(graphics$))
  .subscribe(([agentIds, graphics]) => {
    for (const agentId of agentIds) {
      const agent = agents$.value[agentId]
      invariant(agent)
      graphics.renderAgent(agent)
    }
  })

updates$.subscribe((updates) => {
  chunkUpdates$.next(updates.chunkIds)
  entityUpdates$.next(updates.entityIds)
  agentUpdates$.next(updates.agentIds)
})

combineLatest([build$, graphics$]).subscribe(([build, graphics]) => {
  if (build) {
    graphics.renderBuild(build)
  } else {
    graphics.hideBuild()
  }
})

// TODO find a better way to perform the initial render
graphics$.subscribe((graphics) => {
  for (const agent of Object.values(agents$.value)) {
    graphics.renderAgent(agent)
  }
})

newEntity$.subscribe((newEntityId) => {
  const entity = entities$.value[newEntityId]
  invariant(entity)

  if (entity.type !== EntityType.House) {
    return
  }

  for (const agent of Object.values(agents$.value)) {
    if (!agent.home) {
      agent.home = entity.id

      return // TODO allow multiple agents to have the same home
    }
  }
})
