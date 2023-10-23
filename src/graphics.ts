import {
  Application,
  Container,
  Graphics as PixiGraphics,
  Rectangle,
  Sprite,
} from 'pixi.js'
import invariant from 'tiny-invariant'
import { AgentContainer } from './agent-container.js'
import { CHUNK_SIZE, MAX_CELL_SIZE } from './const.js'
import { EntityContainer } from './entity-container.js'
import { FarmContainer } from './farm-container.js'
import { generateTextures } from './generate-textures.js'
import { HouseContainer } from './house-container.js'
import { SelectContainer } from './select-container.js'
import { StorageContainer } from './storage-container.js'
import { TreeContainer } from './tree-container.js'
import {
  Agent,
  AgentId,
  BuildState,
  CellType,
  Chunk,
  ChunkId,
  Entity,
  EntityId,
  EntityType,
  Select,
  Textures,
  ZoomLevel,
} from './types.js'
import { Vec2 } from './vec2.js'

const CHUNK_MODE: 'sprite' | 'graphics' = 'sprite'

const CELL_TYPE_TO_COLOR: Record<CellType, string> = {
  [CellType.Grass1]: 'hsl(121, 67%, 26%)',
  [CellType.Grass2]: 'hsl(121, 67%, 20%)',
  [CellType.Grass3]: 'hsl(121, 67%, 14%)',
  [CellType.WaterDeep]: 'hsl(220, 90%, 32%)',
  [CellType.WaterShallow]: 'hsl(220, 64%, 64%)',
}

const ENTITY_TYPE_TO_LOW_RES_COLOR: Record<EntityType, string> = {
  [EntityType.Tree]: 'hsl(121, 67%, 8%)',
  [EntityType.Farm]: 'pink',
  [EntityType.House]: 'pink',
  [EntityType.Storage]: 'pink',
}

export class Graphics {
  private readonly app: Application
  private readonly world: Container

  private readonly chunkContainer: Container
  private readonly lowResContainer: Container
  private readonly entityContainer: Container
  private readonly buildContainer: Container
  private readonly agentContainer: Container
  private readonly selectContainer: SelectContainer

  private readonly chunkIdToContainer: Map<ChunkId, Container> = new Map()
  private readonly entityIdToContainer: Map<EntityId, EntityContainer> =
    new Map()
  private readonly chunkIdToLowResEntitiesContainer: Map<ChunkId, Container> =
    new Map()
  private readonly agentIdToContainer: Map<AgentId, AgentContainer> = new Map()

  private readonly textures: Textures

  constructor({
    canvas,
    container,
  }: {
    canvas: HTMLCanvasElement
    container: HTMLDivElement
  }) {
    this.app = new Application({
      view: canvas,
      resizeTo: container,
      // TODO verify this improves performance
      eventMode: 'none',
      // antialias: true,
    })

    this.world = new Container()
    this.app.stage.addChild(this.world)

    this.chunkContainer = new Container()
    this.world.addChild(this.chunkContainer)

    this.lowResContainer = new Container()
    this.world.addChild(this.lowResContainer)

    this.entityContainer = new Container()
    this.world.addChild(this.entityContainer)

    this.buildContainer = new Container()
    this.world.addChild(this.buildContainer)

    this.agentContainer = new Container()
    this.world.addChild(this.agentContainer)

    this.selectContainer = new SelectContainer()
    this.world.addChild(this.selectContainer)

    this.textures = generateTextures(this.app)
  }

  destroy() {
    this.app.destroy(false, { children: true })
  }

  transformWorld({ translate, scale }: { translate: Vec2; scale: number }) {
    this.world.setTransform(translate.x, translate.y, scale, scale)
  }

  updateZoomLevel(zoomLevel: ZoomLevel): void {
    if (zoomLevel === ZoomLevel.High) {
      this.lowResContainer.visible = false
      this.entityContainer.visible = true
    } else {
      invariant(zoomLevel === ZoomLevel.Low)

      this.lowResContainer.visible = true
      this.entityContainer.visible = false
    }
  }

  renderChunk({ chunk }: { chunk: Chunk }) {
    let container = this.chunkIdToContainer.get(chunk.id)
    if (!container) {
      container = newChunkContainer({ chunk, app: this.app })
      this.chunkContainer.addChild(container)
      this.chunkIdToContainer.set(chunk.id, container)
    }
    container.visible = true
  }

  hideChunk({ chunk }: { chunk: Chunk }) {
    let container = this.chunkIdToContainer.get(chunk.id)
    if (!container) {
      return
    }
    container.visible = false
  }

  renderLowResEntities({
    chunk,
    entities,
  }: {
    chunk: Chunk
    entities: Record<EntityId, Entity>
  }) {
    let container = this.chunkIdToLowResEntitiesContainer.get(chunk.id)
    if (!container) {
      container = newLowResEntitiesContainer({
        app: this.app,
        chunk,
        entities,
      })
      this.lowResContainer.addChild(container)
      this.chunkIdToLowResEntitiesContainer.set(chunk.id, container)
    }
    container.visible = true
  }

  updateLowResEntities({
    chunk,
    entities,
    visible,
  }: {
    chunk: Chunk
    entities: Record<EntityId, Entity>
    visible: boolean
  }) {
    let container = this.chunkIdToLowResEntitiesContainer.get(chunk.id)
    if (container) {
      this.lowResContainer.removeChild(container)
      container.destroy(true)
    }

    container = newLowResEntitiesContainer({
      app: this.app,
      chunk,
      entities,
    })
    this.lowResContainer.addChild(container)
    this.chunkIdToLowResEntitiesContainer.set(chunk.id, container)

    container.visible = visible
  }

  hideLowResEntities({ chunk }: { chunk: Chunk }) {
    let container = this.chunkIdToLowResEntitiesContainer.get(chunk.id)
    if (!container) {
      return
    }
    container.visible = false
  }

  renderEntity(entity: Entity, visible: boolean = true) {
    let container = this.entityIdToContainer.get(entity.id)
    if (!container) {
      container = newEntityContainer({
        entity,
        app: this.app,
        textures: this.textures,
      })
      this.entityContainer.addChild(container)
      this.entityIdToContainer.set(entity.id, container)
    }
    container.update(entity)
    container.visible = visible
  }

  updateEntity(entity: Entity, visible: boolean): void {
    this.renderEntity(entity, visible)
  }

  hideEntity(entity: Entity) {
    const container = this.entityIdToContainer.get(entity.id)
    if (!container) {
      return
    }
    container.visible = false
  }

  destroyEntity(entityId: EntityId) {
    const container = this.entityIdToContainer.get(entityId)
    if (!container) {
      return
    }
    this.entityIdToContainer.delete(entityId)
    container.parent.removeChild(container)
    container.destroy()
  }

  renderBuild(build: BuildState) {
    this.buildContainer.visible = true

    for (const child of this.buildContainer.removeChildren()) {
      child.destroy()
    }

    const g = new PixiGraphics()
    g.beginFill(build.valid ? 'brown' : 'red')
    g.drawRect(build.position.x, build.position.y, build.size.x, build.size.y)

    this.buildContainer.addChild(g)
  }

  hideBuild() {
    this.buildContainer.visible = false
  }

  renderAgent(agent: Agent) {
    let container = this.agentIdToContainer.get(agent.id)
    if (!container) {
      container = new AgentContainer(this.textures, agent)
      this.agentIdToContainer.set(agent.id, container)
      this.agentContainer.addChild(container)
    }
    container.update(agent)
  }

  renderSelect(select: Select | null): void {
    this.selectContainer.update(select)
  }
}

function newEntityContainer({
  entity,
  app,
  textures,
}: {
  entity: Entity
  app: Application
  textures: Textures
}): EntityContainer {
  let container: EntityContainer
  switch (entity.type) {
    case EntityType.Tree:
      container = new TreeContainer(textures)
      break
    case EntityType.Farm:
      container = new FarmContainer(textures)
      break
    case EntityType.House:
      container = new HouseContainer(textures)
      break
    case EntityType.Storage:
      container = new StorageContainer(textures)
      break
  }
  container.setTransform(entity.position.x, entity.position.y)
  return container
}

function newLowResEntitiesContainer({
  chunk,
  entities,
  app,
}: {
  chunk: Chunk
  entities: Record<EntityId, Entity>
  app: Application
}): Container {
  const entityIds = new Set<EntityId>()
  for (const entityId of chunk.cells
    .map((cell) => cell.entityId)
    .filter((entityId): entityId is EntityId => !!entityId)) {
    const entity = entities[entityId]
    invariant(entity)
    if (entity.chunkId === chunk.id) {
      entityIds.add(entityId)
    }
  }

  const g = new PixiGraphics()
  for (const entityId of entityIds) {
    const entity = entities[entityId]
    invariant(entity)
    const color = ENTITY_TYPE_TO_LOW_RES_COLOR[entity.type]
    const position = entity.position.sub(chunk.position).mul(MAX_CELL_SIZE)
    const size = entity.size.mul(MAX_CELL_SIZE)
    g.beginFill(color)
    g.drawRect(position.x, position.y, size.x, size.y)
  }

  const texture = app.renderer.generateTexture(g, {
    region: new Rectangle(
      0,
      0,
      CHUNK_SIZE * MAX_CELL_SIZE,
      CHUNK_SIZE * MAX_CELL_SIZE,
    ),
  })

  const sprite = new Sprite(texture)
  sprite.setTransform(
    chunk.position.x,
    chunk.position.y,
    1 / MAX_CELL_SIZE,
    1 / MAX_CELL_SIZE,
  )
  return sprite
}

function newChunkContainer({
  chunk,
  app,
}: {
  chunk: Chunk
  app: Application
}): Container {
  const g = new PixiGraphics()
  invariant(chunk.cells.length === CHUNK_SIZE ** 2)

  // using graphics is slightly better than sprites,
  // but neither are as crisp as graphics via react/pixi...
  //
  if (CHUNK_MODE === 'sprite') {
    for (let i = 0; i < chunk.cells.length; i++) {
      const cell = chunk.cells[i]
      invariant(cell)
      g.beginFill(CELL_TYPE_TO_COLOR[cell.type])
      const { x, y } = new Vec2(i % CHUNK_SIZE, i / CHUNK_SIZE)
        .floor()
        .mul(MAX_CELL_SIZE)
      g.drawRect(x, y, MAX_CELL_SIZE, MAX_CELL_SIZE)
    }
    const texture = app.renderer.generateTexture(g)

    const sprite = new Sprite(texture)
    sprite.setTransform(
      chunk.position.x,
      chunk.position.y,
      1 / MAX_CELL_SIZE,
      1 / MAX_CELL_SIZE,
    )

    return sprite
  } else {
    invariant(CHUNK_MODE === 'graphics')

    for (let i = 0; i < chunk.cells.length; i++) {
      const cell = chunk.cells[i]
      invariant(cell)
      g.beginFill(CELL_TYPE_TO_COLOR[cell.type])
      const { x, y } = new Vec2(i % CHUNK_SIZE, i / CHUNK_SIZE).floor()
      g.drawRect(x, y, 1, 1)
    }
    g.setTransform(chunk.position.x, chunk.position.y)
    return g
  }
}
