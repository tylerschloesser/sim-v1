import { Application, Container } from 'pixi.js'

interface Graphics {
  app: Application
  world: Container
}

export function initGraphics({
  canvas,
  container,
}: {
  canvas: HTMLCanvasElement
  container: HTMLDivElement
}): Graphics {
  const app = new Application({
    view: canvas,
    resizeTo: container,
    antialias: true,
  })

  const world = new Container()
  app.stage.addChild(world)

  return {
    app,
    world,
  }
}

export function destroyGraphics(graphics: Graphics): void {
  graphics.app.destroy(false, { children: true })
}
