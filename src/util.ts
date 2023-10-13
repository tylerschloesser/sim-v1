import { MAX_CELL_SIZE, MIN_CELL_SIZE } from './const.js'

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
