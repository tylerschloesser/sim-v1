import { MAX_CELL_SIZE, MIN_CELL_SIZE } from './const.js'
import { Camera } from './state.js'
import { Vec2 } from './vec2.js'

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function hackPointerEvent(e: PointerEvent) {
  if (e.pointerType === 'touch') {
    // Safari iOS doesn't set pressure for some reason...
    // It's readonly so we need to hack it...
    Object.defineProperty(e, 'pressure', {
      value: 0.5,
    })
  }
  return e
}

export function getCellSize(zoom: number): number {
  return MIN_CELL_SIZE + (MAX_CELL_SIZE - MIN_CELL_SIZE) * zoom
}

export function screenToWorld({
  screen,
  viewport,
  camera,
}: {
  screen: Vec2
  viewport: Vec2
  camera: Camera
}): Vec2 {
  const cellSize = getCellSize(camera.zoom)
  return screen.sub(viewport.div(2)).div(cellSize).add(camera.position)
}

export function worldToScreen({
  world,
  viewport,
  camera,
}: {
  world: Vec2
  viewport: Vec2
  camera: Camera
}): Vec2 {
  const cellSize = getCellSize(camera.zoom)
  return world.sub(camera.position).mul(cellSize).add(viewport.div(2))
}
