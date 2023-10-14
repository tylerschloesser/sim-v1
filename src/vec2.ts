import invariant from 'tiny-invariant'

export class Vec2 {
  readonly x: number
  readonly y: number

  constructor(x: number | PointerEvent | WheelEvent = 0, y?: number) {
    if (typeof x === 'number') {
      this.x = x
      this.y = y ?? x
    } else {
      invariant(typeof y === 'undefined')
      this.x = x.clientX
      this.y = x.clientY
    }
  }

  add(v: Vec2 | number): Vec2 {
    if (typeof v === 'number') {
      return new Vec2(this.x + v, this.y + v)
    }
    return new Vec2(this.x + v.x, this.y + v.y)
  }

  sub(v: Vec2 | number): Vec2 {
    if (typeof v === 'number') {
      return new Vec2(this.x - v, this.y - v)
    }
    return new Vec2(this.x - v.x, this.y - v.y)
  }

  mul(s: number): Vec2 {
    return new Vec2(this.x * s, this.y * s)
  }

  div(s: number): Vec2 {
    invariant(s !== 0)
    return new Vec2(this.x / s, this.y / s)
  }

  floor(): Vec2 {
    return new Vec2(Math.floor(this.x), Math.floor(this.y))
  }

  ceil(): Vec2 {
    return new Vec2(Math.ceil(this.x), Math.ceil(this.y))
  }

  mod(m: number): Vec2 {
    return new Vec2(((this.x % m) + m) % m, ((this.y % m) + m) % m)
  }

  static isEqual(a: Vec2, b: Vec2) {
    return a.x === b.x && a.y === b.y
  }
}
