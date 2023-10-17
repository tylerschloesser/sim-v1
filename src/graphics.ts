import {
  Application,
  Container,
  Graphics as PixiGraphics,
  Rectangle,
  Sprite,
  Texture,
} from 'pixi.js'
import invariant from 'tiny-invariant'
import { CHUNK_SIZE, MAX_CELL_SIZE } from './const.js'
import {
  CellType,
  Chunk,
  ChunkId,
  Entity,
  EntityId,
  EntityType,
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
}

enum TextureType {
  Tree = 'tree',
}

type Textures = Record<TextureType, Texture>

class TreeContainer extends Container {
  constructor(textures: Textures) {
    super()
    const sprite = new Sprite(textures.tree)
    sprite.setTransform(0, 0, 1 / MAX_CELL_SIZE, 1 / MAX_CELL_SIZE)
    this.addChild(sprite)
  }
}

function generateTreeTexture(app: Application): Texture {
  const g = new PixiGraphics()

  // hack so that tree is centered
  // g.beginFill('hsla(0, 0%, 0%, .01)')
  // g.drawRect(0, 0, MAX_CELL_SIZE, MAX_CELL_SIZE)

  g.beginFill('hsl(121, 67%, 8%)')
  g.drawRect(0, 0, MAX_CELL_SIZE, MAX_CELL_SIZE)

  return app.renderer.generateTexture(g)
}

export class Graphics {
  private readonly app: Application
  private readonly world: Container

  private readonly chunkIdToContainer: Map<ChunkId, Promise<Container>>
  private readonly entityIdToContainer: Map<EntityId, Promise<Container>>

  private readonly chunkIdToLowResEntitiesContainer: Map<
    ChunkId,
    Promise<Container>
  >

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
      // antialias: true,
    })

    this.world = new Container()
    this.app.stage.addChild(this.world)

    const g = new PixiGraphics()
    g.beginFill('red')
    g.drawRect(0, 0, 1, 1)
    this.world.addChild(g)

    this.chunkIdToContainer = new Map()
    this.entityIdToContainer = new Map()
    this.chunkIdToLowResEntitiesContainer = new Map()

    this.textures = {
      tree: generateTreeTexture(this.app),
    }
  }

  destroy() {
    this.app.destroy(false, { children: true })
  }

  transformWorld({ translate, scale }: { translate: Vec2; scale: number }) {
    this.world.setTransform(translate.x, translate.y, scale, scale)
  }

  renderChunk({ chunk }: { chunk: Chunk }) {
    let promise = this.chunkIdToContainer.get(chunk.id)
    if (!promise) {
      promise = newChunkContainer({ chunk, app: this.app })
      promise.then((container) => {
        this.world.addChild(container)
      })
      this.chunkIdToContainer.set(chunk.id, promise)
    }
    promise.then((container) => {
      container.visible = true
    })
  }

  hideChunk({ chunk }: { chunk: Chunk }) {
    let promise = this.chunkIdToContainer.get(chunk.id)
    if (!promise) {
      return
    }
    promise.then((container) => {
      container.visible = false
    })
  }

  renderLowResEntities({
    chunk,
    entities,
  }: {
    chunk: Chunk
    entities: Record<EntityId, Entity>
  }) {
    let promise = this.chunkIdToLowResEntitiesContainer.get(chunk.id)
    if (!promise) {
      promise = newLowResEntitiesContainer({
        app: this.app,
        chunk,
        entities,
      })
      promise.then((container) => {
        this.world.addChild(container)
      })
      this.chunkIdToLowResEntitiesContainer.set(chunk.id, promise)
    }
    promise.then((container) => {
      container.visible = true
    })
  }

  hideLowResEntities({ chunk }: { chunk: Chunk }) {
    let promise = this.chunkIdToLowResEntitiesContainer.get(chunk.id)
    if (!promise) {
      return
    }
    promise.then((container) => {
      container.visible = false
    })
  }

  renderEntity({ entity }: { entity: Entity }) {
    let promise = this.entityIdToContainer.get(entity.id)
    if (!promise) {
      promise = newEntityContainer({
        entity,
        app: this.app,
        textures: this.textures,
      })
      promise.then((container) => {
        this.world.addChild(container)
      })
      this.entityIdToContainer.set(entity.id, promise)
    }
    promise.then((container) => {
      container.visible = true
    })
  }

  hideEntity({ entity }: { entity: Entity }) {
    const promise = this.entityIdToContainer.get(entity.id)
    if (!promise) {
      return
    }
    promise.then((container) => {
      container.visible = false
    })
  }
}

async function newEntityContainer({
  entity,
  app,
  textures,
}: {
  entity: Entity
  app: Application
  textures: Textures
}): Promise<Container> {
  let container: Container
  switch (entity.type) {
    case EntityType.Tree:
      container = new TreeContainer(textures)
      break
    case EntityType.Farm:
    case EntityType.House:
      // TODO
      container = new Container()
      break
  }
  container.setTransform(
    entity.position.x,
    entity.position.y,
    entity.size.x,
    entity.size.y,
  )
  return container
}

async function newLowResEntitiesContainer({
  chunk,
  entities,
  app,
}: {
  chunk: Chunk
  entities: Record<EntityId, Entity>
  app: Application
}): Promise<Container> {
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

async function newChunkContainer({
  chunk,
  app,
}: {
  chunk: Chunk
  app: Application
}): Promise<Container> {
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
