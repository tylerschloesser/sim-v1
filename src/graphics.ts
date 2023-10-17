import { Application, Container, Graphics as PixiGraphics } from 'pixi.js'

export class Graphics {
  private readonly app: Application
  private readonly world: Container

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
      antialias: true,
    })

    this.world = new Container()
    this.app.stage.addChild(this.world)

    const g = new PixiGraphics()
    g.beginFill('red')
    g.drawRect(200, 200, 100, 100)
    this.world.addChild(g)
  }

  destroy() {
    this.app.destroy(false, { children: true })
  }
}
