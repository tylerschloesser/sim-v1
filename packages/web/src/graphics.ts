import {
  Application,
  Container,
  Graphics as PixiGraphics,
  Rectangle,
  Sprite,
  Texture,
} from 'pixi.js'
import invariant from 'tiny-invariant'
import { AgentContainer } from './agent-container.js'
import { CHUNK_SIZE, DPR, TEXTURE_SCALE } from './const.js'
import { EntityContainer } from './entity-container.js'
import { FarmContainer } from './farm-container.js'
import { generateTextures } from './generate-textures.js'
import { HouseContainer } from './house-container.js'
import { SelectContainer } from './select-container.js'
import { StorageContainer } from './storage-container.js'
import {
  Agent,
  AgentId,
  BuildState,
  CellType,
  Chunk,
  ChunkId,
  Entity,
  EntityId,
  EntityStateType,
  EntityType,
  ResourceType,
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
  [EntityType.Farm]: 'pink',
  [EntityType.House]: 'pink',
  [EntityType.Storage]: 'pink',
  [EntityType.Well]: 'pink',
  [EntityType.Stockpile]: 'pink',
}

const RESOURCE_TYPE_TO_LOW_RES_COLOR: Record<ResourceType, string> = {
  [ResourceType.Tree]: 'hsl(121, 67%, 8%)',
}

export class Graphics {
  private readonly app: Application
  private readonly world: Container

  private readonly chunkContainer: Container
  private readonly chunkResourceContainer: Container
  private readonly lowResContainer: Container
  private readonly entityContainer: Container
  private readonly buildContainer: Container
  private readonly agentContainer: Container
  private readonly selectContainer: SelectContainer

  private readonly chunkIdToContainer: Map<ChunkId, Container> = new Map()
  private readonly chunkIdToChunkResourceContainer: Map<ChunkId, Container> =
    new Map()

  private readonly entityIdToContainer: Map<EntityId, EntityContainer> =
    new Map()
  private readonly chunkIdToLowResContainer: Map<ChunkId, Container> = new Map()
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
      resolution: DPR,
    })

    this.app.stage.setTransform(0, 0, 1 / DPR, 1 / DPR)

    this.world = new Container()
    this.app.stage.addChild(this.world)

    this.chunkContainer = new Container()
    this.world.addChild(this.chunkContainer)

    this.chunkResourceContainer = new Container()
    this.world.addChild(this.chunkResourceContainer)

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
    const lowRes = zoomLevel === ZoomLevel.Low

    this.lowResContainer.visible = lowRes

    this.entityContainer.visible = !lowRes
    this.chunkResourceContainer.visible = !lowRes
  }

  renderChunk({ chunk }: { chunk: Chunk }) {
    {
      let container = this.chunkIdToContainer.get(chunk.id)
      if (!container) {
        container = newChunkContainer({ chunk, app: this.app })
        this.chunkContainer.addChild(container)
        this.chunkIdToContainer.set(chunk.id, container)
      }
      container.visible = true
    }

    {
      let container = this.chunkIdToChunkResourceContainer.get(chunk.id)
      if (!container) {
        container = newChunkResouceContainer({
          chunk,
          app: this.app,
          textures: this.textures,
        })
        this.chunkResourceContainer.addChild(container)
        this.chunkIdToChunkResourceContainer.set(chunk.id, container)
      }
      container.visible = true
    }
  }

  hideChunk({ chunk }: { chunk: Chunk }) {
    {
      let container = this.chunkIdToContainer.get(chunk.id)
      if (container) {
        container.visible = false
      }
    }
    {
      let container = this.chunkIdToChunkResourceContainer.get(chunk.id)
      if (container) {
        container.visible = false
      }
    }
    {
      const container = this.chunkIdToLowResContainer.get(chunk.id)
      if (container) {
        container.visible = false
      }
    }
  }

  renderLowResChunk({
    chunk,
    entities,
  }: {
    chunk: Chunk
    entities: Record<EntityId, Entity>
  }) {
    let container = this.chunkIdToLowResContainer.get(chunk.id)
    if (!container) {
      container = newLowResContainer({
        app: this.app,
        chunk,
        entities,
        textures: this.textures,
      })
      this.lowResContainer.addChild(container)
      this.chunkIdToLowResContainer.set(chunk.id, container)
    }
    container.visible = true
  }

  updateLowResChunk({
    chunk,
    entities,
    visible,
  }: {
    chunk: Chunk
    entities: Record<EntityId, Entity>
    visible: boolean
  }) {
    {
      let container = this.chunkIdToLowResContainer.get(chunk.id)
      if (container) {
        this.lowResContainer.removeChild(container)
        container.destroy(true)
      }

      container = newLowResContainer({
        app: this.app,
        chunk,
        entities,
        textures: this.textures,
      })
      this.lowResContainer.addChild(container)
      this.chunkIdToLowResContainer.set(chunk.id, container)

      container.visible = visible
    }
  }

  hideLowResChunk({ chunk }: { chunk: Chunk }) {
    let container = this.chunkIdToLowResContainer.get(chunk.id)
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
    if (entity.state.type === EntityStateType.Build) {
      container.alpha = 0.5
    } else {
      container.alpha = 1
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

class SimpleEntityContainer extends EntityContainer {
  constructor(texture: Texture) {
    super()
    const sprite = new Sprite(texture)
    sprite.setTransform(0, 0, 1 / TEXTURE_SCALE, 1 / TEXTURE_SCALE)
    this.addChild(sprite)
  }
  update(_entity: Entity): void {}
}

function newEntityContainer({
  entity,
  textures,
}: {
  entity: Entity
  app: Application
  textures: Textures
}): EntityContainer {
  let container: EntityContainer
  switch (entity.type) {
    case EntityType.Farm:
      container = new FarmContainer(textures)
      break
    case EntityType.House:
      container = new HouseContainer(textures)
      break
    case EntityType.Storage:
      container = new StorageContainer(textures, entity.type)
      break
    case EntityType.Stockpile:
      container = new StorageContainer(textures, entity.type)
      break
    case EntityType.Well:
      container = new SimpleEntityContainer(textures.well)
      break
    case EntityType.Stockpile:
      container = new SimpleEntityContainer(textures.stockpile)
      break
  }
  container.setTransform(entity.position.x, entity.position.y)
  return container
}

function newLowResContainer({
  chunk,
  entities,
  app,
  textures,
}: {
  chunk: Chunk
  entities: Record<EntityId, Entity>
  app: Application
  textures: Textures
}): Container {
  const seenEntityIds = new Set<EntityId>()
  const g = new PixiGraphics()

  for (let i = 0; i < chunk.cells.length; i++) {
    const cell = chunk.cells[i]

    invariant(cell)
    invariant(!cell.entityId || !cell.resource)

    let rect:
      | {
          color: string
          position: Vec2
          size: Vec2
        }
      | undefined

    if (cell.entityId && !seenEntityIds.has(cell.entityId)) {
      seenEntityIds.add(cell.entityId)

      const entity = entities[cell.entityId]
      invariant(entity)

      rect = {
        color: ENTITY_TYPE_TO_LOW_RES_COLOR[entity.type],
        position: entity.position.sub(chunk.position).mul(TEXTURE_SCALE),
        size: entity.size.mul(TEXTURE_SCALE),
      }
    } else if (cell.resource) {
      const position = new Vec2(i % CHUNK_SIZE, i / CHUNK_SIZE)
        .floor()
        .mul(TEXTURE_SCALE)

      rect = {
        color: RESOURCE_TYPE_TO_LOW_RES_COLOR[cell.resource.type],
        position,
        size: new Vec2(1).mul(TEXTURE_SCALE),
      }
    }

    if (rect) {
      const { color, position, size } = rect
      g.beginFill(color)
      g.drawRect(position.x, position.y, size.x, size.y)
    }
  }

  const texture = app.renderer.generateTexture(g, {
    region: new Rectangle(
      0,
      0,
      CHUNK_SIZE * TEXTURE_SCALE,
      CHUNK_SIZE * TEXTURE_SCALE,
    ),
  })

  const sprite = new Sprite(texture)
  sprite.setTransform(
    chunk.position.x,
    chunk.position.y,
    1 / TEXTURE_SCALE,
    1 / TEXTURE_SCALE,
  )
  return sprite
}

function newChunkResouceContainer({
  chunk,
  textures,
}: {
  chunk: Chunk
  app: Application
  textures: Textures
}): Container {
  const container = new Container()

  container.setTransform(chunk.position.x, chunk.position.y)

  for (let i = 0; i < chunk.cells.length; i++) {
    const cell = chunk.cells[i]
    invariant(cell)

    if (!cell.resource) {
      continue
    }

    let sprite: Sprite
    switch (cell.resource.type) {
      case ResourceType.Tree:
        sprite = new Sprite(textures.tree)
        break
    }

    const { x, y } = new Vec2(i % CHUNK_SIZE, i / CHUNK_SIZE).floor()
    sprite.setTransform(x, y, 1 / TEXTURE_SCALE, 1 / TEXTURE_SCALE)

    container.addChild(sprite)
  }

  // TODO convert to texture/sprite?

  return container
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

  for (let i = 0; i < chunk.cells.length; i++) {
    const cell = chunk.cells[i]
    invariant(cell)
    g.beginFill(CELL_TYPE_TO_COLOR[cell.type])
    const { x, y } = new Vec2(i % CHUNK_SIZE, i / CHUNK_SIZE)
      .floor()
      .mul(TEXTURE_SCALE)
    g.drawRect(x, y, TEXTURE_SCALE, TEXTURE_SCALE)
  }
  const texture = app.renderer.generateTexture(g)

  const sprite = new Sprite(texture)
  sprite.setTransform(
    chunk.position.x,
    chunk.position.y,
    1 / TEXTURE_SCALE,
    1 / TEXTURE_SCALE,
  )

  return sprite
}
