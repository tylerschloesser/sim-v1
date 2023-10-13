import {
  BehaviorSubject,
  Subject,
  combineLatest,
  map,
  pairwise,
  startWith,
} from 'rxjs'
import { MAX_ZOOM, MIN_ZOOM } from './const.js'
import { clamp, getCellSize, screenToWorld } from './util.js'
import { Vec2 } from './vec2.js'
import { bind } from '@react-rxjs/core'

export interface Camera {
  position: Vec2
  zoom: number
}

export const pointer$ = new Subject<PointerEvent>()
export const wheel$ = new Subject<WheelEvent>()
export const viewport$ = new BehaviorSubject<Vec2>(new Vec2())
export const camera$ = new BehaviorSubject<Camera>({
  position: new Vec2(),
  zoom: 0.5,
})

export const hover$ = combineLatest([pointer$, viewport$, camera$]).pipe(
  map(([pointer, viewport, camera]) => {
    if (pointer.type === 'pointerleave' || pointer.type === 'pointerout') {
      return null
    }

    return screenToWorld({
      screen: new Vec2(pointer),
      viewport,
      camera,
    })
  }),
  startWith(null),
)

export const [useCamera] = bind(camera$)
export const [useViewport] = bind(viewport$)
export const [useHover] = bind(hover$)

pointer$.pipe(pairwise()).subscribe(([prev, next]) => {
  if (next.type === 'pointermove' && next.pressure > 0) {
    const { zoom, position } = camera$.value
    const cellSize = getCellSize(zoom)

    const delta = new Vec2(next).sub(new Vec2(prev)).mul(-1).div(cellSize)

    camera$.next({
      position: position.add(delta),
      zoom,
    })
  }
})

wheel$.subscribe((e) => {
  const zoom = {
    prev: camera$.value.zoom,
    next: clamp(camera$.value.zoom + e.deltaY / -1000, MIN_ZOOM, MAX_ZOOM),
  }

  if (zoom.prev === zoom.next) {
    camera$.next({
      position: camera$.value.position,
      zoom: zoom.next,
    })
    return
  }

  const anchor = new Vec2(e).sub(viewport$.value.div(2))
  const adjust = anchor
    .div(getCellSize(zoom.prev))
    .sub(anchor.div(getCellSize(zoom.next)))

  camera$.next({
    position: camera$.value.position.add(adjust),
    zoom: zoom.next,
  })
})
