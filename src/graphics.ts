import { Application, Container, Graphics as PixiGraphics } from 'pixi.js'
import { Vec2 } from './vec2.js'

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
    g.drawRect(0, 0, 1, 1)
    this.world.addChild(g)
  }

  destroy() {
    this.app.destroy(false, { children: true })
  }

  transformWorld({ translate, scale }: { translate: Vec2; scale: number }) {
    this.world.setTransform(translate.x, translate.y, scale, scale)
  }
}
