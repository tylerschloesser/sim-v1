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
  ENTITY_MATERIALS,
  ENTITY_TYPE_TO_SIZE,
  INITIAL_ZOOM,
  MAX_CELL_SIZE,
  MAX_ZOOM,
  MIN_CELL_SIZE,
  MIN_ZOOM,
  WHEEL_SCALE,
} from './const.js'
import { Graphics } from './graphics.js'
import {
  Agent,
  AgentId,
  BuildJobState,
  BuildState,
  Camera,
  Chunk,
  ChunkId,
  Config,
  Entity,
  EntityId,
  EntityState,
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
  cellSizeToZoom,
  clamp,
  getCell,
  getCellBoundingBox,
  getCellSize,
  getChunkIds,
  getNextJobId,
  isEqual,
  screenToWorld,
} from './util.js'
import { Vec2 } from './vec2.js'

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

export const jobs$ = new BehaviorSubject<Record<JobId, Job>>({})

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
  .pipe(withLatestFrom(graphics$, visibleChunkIds$, zoomLevel$, chunks$))
  .subscribe(([chunkUpdates, graphics, visibleChunkIds, zoomLevel, chunks]) => {
    const entities = entities$.value
    for (const chunkId of chunkUpdates) {
      const visible = visibleChunkIds.has(chunkId)
      const chunk = chunks[chunkId]
      invariant(chunk)
      graphics.updateLowResChunk({
        chunk,
        entities,
        visible: visible && zoomLevel === ZoomLevel.Low,
      })
    }
  })

entityUpdates$
  .pipe(withLatestFrom(graphics$, visibleChunkIds$, zoomLevel$, entities$))
  .subscribe(
    ([entityUpdates, graphics, visibleChunkIds, zoomLevel, entities]) => {
      const visible = zoomLevel === ZoomLevel.High

      for (const entityId of entityUpdates) {
        const entity = entities[entityId]

        if (!entity) {
          graphics.destroyEntity(entityId)
          continue
        }

        graphics.updateEntity(
          entity,
          visible &&
            Array.from(entity.chunkIds).some((chunkId) =>
              visibleChunkIds.has(chunkId),
            ),
        )
      }
    },
  )

visibleChunkIds$
  .pipe(withLatestFrom(chunks$, entities$))
  .subscribe(([visibleChunkIds, chunks, entities]) => {
    const newChunkIds = new Set<ChunkId>()
    const newEntityIds = new Set<EntityId>()

    for (const chunkId of visibleChunkIds) {
      if (!chunks[chunkId]) {
        const result = generateChunk(chunkId)

        invariant(chunks[result.chunk.id] === undefined)
        invariant(newChunkIds.has(result.chunk.id) === false)
        newChunkIds.add(result.chunk.id)
        chunks[result.chunk.id] = result.chunk

        for (const entry of Object.entries(result.entities)) {
          const [entityId, entity] = entry as [EntityId, Entity]
          invariant(entities[entityId] === undefined)
          invariant(newEntityIds.has(entityId) === false)
          newEntityIds.add(entityId)
          entities[entityId] = entity
        }
      }
    }

    if (newChunkIds.size === 0) {
      invariant(newEntityIds.size === 0)
      return
    }

    entityUpdates$.next(newEntityIds)
    chunkUpdates$.next(newChunkIds)

    chunks$.next(chunks)
    entities$.next(entities)
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

type PointerId = number

const pointerEventCache = new Map<PointerId, PointerEvent>()

pointer$.pipe(withLatestFrom(pointerMode$)).subscribe(([ev, mode]) => {
  const cache = pointerEventCache.get(ev.pointerId)
  pointerEventCache.set(ev.pointerId, ev)

  switch (ev.type) {
    case 'pointermove': {
      if (!cache) {
        // TODO not sure why this happens...
        break
      }
      if (pointerEventCache.size === 1) {
        handlePointerMoveOne({ next: ev, prev: cache }, mode)
      } else if (pointerEventCache.size === 2) {
        let other: PointerEvent | undefined
        for (const entry of pointerEventCache.entries()) {
          if (entry[0] !== ev.pointerId) {
            other = entry[1]
          }
        }
        invariant(other)
        handlePointerMoveTwo(
          {
            next: ev,
            prev: cache,
            other,
          },
          mode,
        )
      } else {
        // >2 fingers not supported
      }
      break
    }
    case 'pointerout':
    case 'pointerleave':
    case 'pointerup': {
      pointerEventCache.delete(ev.pointerId)
      break
    }
  }
})

function handlePointerMoveOne(
  { next, prev }: { next: PointerEvent; prev: PointerEvent },
  mode: PointerMode,
): void {
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
}

const pinch$ = new Subject<{
  center: Vec2
  drag: Vec2
  factor: number
}>()

pinch$
  .pipe(withLatestFrom(camera$, viewport$))
  .subscribe(([pinch, camera, viewport]) => {
    const scale = {
      prev: getCellSize(camera.zoom),
      next: clamp(
        getCellSize(camera.zoom) * pinch.factor,
        MIN_CELL_SIZE,
        MAX_CELL_SIZE,
      ),
    }

    const zoom = {
      prev: camera.zoom,
      next: cellSizeToZoom(scale.next),
    }

    const anchor = pinch.center.sub(viewport.div(2))

    const adjust = anchor
      .div(scale.prev)
      .sub(anchor.div(scale.next))
      .add(pinch.drag.div(scale.next))

    camera$.next({
      position: camera.position.add(adjust),
      zoom: zoom.next,
    })
  })

function handlePointerMoveTwo(
  ev: {
    next: PointerEvent
    prev: PointerEvent
    other: PointerEvent
  },
  _mode: PointerMode,
): void {
  invariant(pointerEventCache.size === 2)

  const prev = new Vec2(ev.prev)
  const next = new Vec2(ev.next)
  const other = new Vec2(ev.other)

  const center = {
    prev: other.add(prev.sub(other).div(2)),
    next: other.add(next.sub(other).div(2)),
  }

  const dist = {
    prev: other.sub(prev).dist(),
    next: other.sub(next).dist(),
  }

  pinch$.next({
    center: center.next,
    drag: center.next.sub(center.prev).mul(-1),
    factor: dist.next / dist.prev,
  })
}

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

    const size = ENTITY_TYPE_TO_SIZE[entityType]
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

confirmBuild$
  .pipe(withLatestFrom(chunks$, entities$, jobs$))
  .subscribe(([build, chunks, entities, jobs]) => {
    let entity: Entity

    const entityId: EntityId = `entity.${build.position.x}.${build.position.y}`
    const chunkIds = getChunkIds(build.position, build.size)

    const materials = {
      // copy because we change values to zero later
      ...ENTITY_MATERIALS[build.entityType],
    }
    let state: EntityState
    if (build.force || Object.keys(materials).length === 0) {
      state = { type: EntityStateType.Active }
    } else {
      state = { type: EntityStateType.Build, materials }
      for (const itemType of Object.keys(materials) as ItemType[]) {
        materials[itemType] = 0
      }
    }

    switch (build.entityType) {
      case EntityType.House:
        entity = {
          id: entityId,
          chunkIds,
          type: EntityType.House,
          position: build.position,
          size: build.size,
          state,
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
          chunkIds,
          type: EntityType.Farm,
          position: build.position,
          size: build.size,
          state,
          cells,
          pickJobId: null,
          waterJobId: null,
        }
        break
      }
      case EntityType.Storage: {
        entity = {
          id: entityId,
          chunkIds,
          type: EntityType.Storage,
          position: build.position,
          size: build.size,
          state,
          inventory: [],
        }
        break
      }
      case EntityType.Well: {
        entity = {
          id: entityId,
          chunkIds,
          type: EntityType.Well,
          position: build.position,
          size: build.size,
          state,
        }
        break
      }
      case EntityType.Stockpile: {
        entity = {
          id: entityId,
          chunkIds,
          type: EntityType.Stockpile,
          position: build.position,
          size: build.size,
          state,
          inventory: [],
        }
        break
      }
    }

    for (let x = 0; x < entity.size.x; x++) {
      for (let y = 0; y < entity.size.y; y++) {
        const cell = getCell(chunks, entity.position.add(new Vec2(x, y)))
        cell.entityId = entity.id
      }
    }

    if (entity.state.type === EntityStateType.Build) {
      const jobId = getNextJobId()
      invariant(jobs[jobId] === undefined)
      jobs[jobId] = {
        id: jobId,
        type: JobType.Build,
        entityId: entity.id,
        state: BuildJobState.PickUpMaterials,
      }
      jobs$.next(jobs)
      jobUpdates$.next(new Set([jobId]))
    }

    invariant(entities[entity.id] === undefined)
    entities[entity.id] = entity

    chunks$.next(chunks)

    chunkUpdates$.next(new Set(chunkIds))
    entityUpdates$.next(new Set([entityId]))

    newEntity$.next(entityId)
  })

export const agents$ = new BehaviorSubject<Record<AgentId, Agent>>({
  '0': {
    id: '0',
    position: new Vec2(0, 0),
    inventory: null,
    fatigue: 0,
    hunger: 0,
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

combineLatest([graphics$, camera$, viewport$]).subscribe(
  ([graphics, camera, viewport]) => {
    const cellSize = getCellSize(camera.zoom)
    console.log(viewport)
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
      graphics.renderLowResChunk({ chunk, entities })
    }

    for (const chunkId of updatedChunkIds.hide) {
      const chunk = chunks[chunkId]
      invariant(chunk)
      graphics.hideLowResChunk({ chunk })
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
        graphics.renderLowResChunk({ chunk, entities })
      } else {
        graphics.hideLowResChunk({ chunk })
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
      for (const chunkId of getChunkIds(entity.position, entity.size)) {
        if (updatedChunkIds.show.has(chunkId)) {
          graphics.renderEntity(entity)
        } else if (updatedChunkIds.hide.has(chunkId)) {
          graphics.hideEntity(entity)
        }
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
export const jobUpdates$ = new Subject<Set<JobId>>()

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
  if (updates.chunkIds.size > 0) {
    chunkUpdates$.next(updates.chunkIds)
  }
  if (updates.entityIds.size > 0) {
    entityUpdates$.next(updates.entityIds)
  }
  if (updates.agentIds.size > 0) {
    agentUpdates$.next(updates.agentIds)
  }
  if (updates.jobIds.size > 0) {
    jobUpdates$.next(updates.jobIds)
  }
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

newEntity$
  .pipe(withLatestFrom(entities$))
  .subscribe(([newEntityId, entities]) => {
    const entity = entities[newEntityId]
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
