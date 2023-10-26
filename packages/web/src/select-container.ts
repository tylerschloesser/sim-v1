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

    if (!select?.end) {
      return
    }

    if (select.end) {
      const bb = getCellBoundingBox(select.start, select.end)
      const size = bb.br.sub(bb.tl).add(1)

      this.g.beginFill('hsla(240, 50%, 50%, .5)')
      this.g.drawRect(bb.tl.x, bb.tl.y, size.x, size.y)
    }
  }
}
