import { Container, Graphics } from 'pixi.js'
import { Select } from './types.js'
import { getCellBoundingBox } from './util.js'

export class SelectContainer extends Container {
  g = new Graphics()

  constructor() {
    super()
    this.addChild(this.g)
  }

  update(select: Select | null): void {
    this.g.clear()

    if (select === null) {
      return
    }

    // TODO don't scale this with the world. To fix aliasing
    this.g.lineStyle(0.1, 'pink')
    this.g.drawRect(select.start.x, select.start.y, 1, 1)

    if (select.end) {
      this.g.drawRect(select.end.x, select.end.y, 1, 1)

      const bb = getCellBoundingBox(select.start, select.end)
      const size = bb.br.sub(bb.tl).add(1)
      this.g.drawRect(bb.tl.x, bb.tl.y, size.x, size.y)
    }
  }
}
