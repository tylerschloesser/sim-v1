import { Container, Graphics, Sprite, Stage, Text } from '@pixi/react'
import { Subscribe, bind } from '@react-rxjs/core'
import * as PIXI from 'pixi.js'
import { BlurFilter } from 'pixi.js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  map,
  pairwise,
  startWith,
} from 'rxjs'
import invariant from 'tiny-invariant'
import styles from './app.module.scss'
import { MAX_ZOOM, MIN_ZOOM } from './const.js'
import { clamp, getCellSize, hackPointerEvent } from './util.js'
import { Vec2 } from './vec2.js'

interface Camera {
  position: Vec2
  zoom: number
}

const pointer$ = new Subject<PointerEvent>()
const wheel$ = new Subject<WheelEvent>()

const camera$ = new BehaviorSubject<Camera>({
  position: new Vec2(),
  zoom: 0.5,
})

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

const [useCamera] = bind(camera$)

const viewport$ = new BehaviorSubject<Vec2>(new Vec2())
const [useViewport] = bind(viewport$)

function GridContainer() {
  const camera = useCamera()
  const viewport = useViewport()
  const cellSize = getCellSize(camera.zoom)

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear()

      g.lineStyle({
        width: 1,
        color: '0x222',
      })

      const cols = Math.ceil(viewport.x / cellSize) + 1
      const rows = Math.ceil(viewport.y / cellSize) + 1

      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          g.moveTo(col * cellSize, 0)
          g.lineTo(col * cellSize, cellSize * rows)

          g.moveTo(0, row * cellSize)
          g.lineTo(cellSize * cols, row * cellSize)
        }
      }
    },
    [viewport, cellSize],
  )

  return (
    <Graphics
      draw={draw}
      position={camera.position
        .mul(-1)
        .mul(cellSize)
        .add(viewport.div(2))
        .mod(cellSize)
        .sub(cellSize)}
    />
  )
}

export function App() {
  const blurFilter = useMemo(() => new BlurFilter(4), [])

  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const rect = container?.getBoundingClientRect()
  useEventListeners(container)
  useResizeObserver(container)

  return (
    <div className={styles.app} ref={setContainer}>
      {container && (
        <Stage
          width={rect?.width}
          height={rect?.height}
          className={styles.app__canvas}
          options={{
            resizeTo: container,
          }}
        >
          <Subscribe>
            <HoverContainer />
            <GridContainer />
            <Sprite
              image="https://pixijs.io/pixi-react/img/bunny.png"
              x={400}
              y={270}
              anchor={{ x: 0.5, y: 0.5 }}
            />

            <Container x={400} y={330}>
              <Text
                text="Hello World"
                anchor={{ x: 0.5, y: 0.5 }}
                filters={[blurFilter]}
              />
            </Container>
          </Subscribe>
        </Stage>
      )}
    </div>
  )
}

function useEventListeners(container: HTMLDivElement | null) {
  useEffect(() => {
    if (!container) return

    const ac = new AbortController()
    const { signal } = ac

    container.addEventListener(
      'pointermove',
      (e) => {
        pointer$.next(hackPointerEvent(e))
      },
      { signal },
    )

    container.addEventListener(
      'pointerleave',
      (e) => {
        pointer$.next(hackPointerEvent(e))
      },
      { signal },
    )

    container.addEventListener(
      'wheel',
      (e) => {
        wheel$.next(e)
        e.preventDefault()
      },
      { signal, passive: false },
    )

    return () => {
      ac.abort()
    }
  }, [container])
}

function screenToWorld({
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

function worldToScreen({
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

const hover$ = combineLatest([pointer$, viewport$, camera$]).pipe(
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
const [useHover] = bind(hover$)

function HoverContainer() {
  const hover = useHover()
  const viewport = useViewport()
  const camera = useCamera()
  const cellSize = getCellSize(camera.zoom)

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear()
      g.lineStyle(2, 'red')
      g.drawRect(0, 0, cellSize, cellSize)
    },
    [cellSize],
  )

  if (hover === null) return null

  return (
    <Graphics
      draw={draw}
      position={worldToScreen({
        world: hover.floor(),
        camera,
        viewport,
      })}
    />
  )
}

function useResizeObserver(container: HTMLDivElement | null) {
  useEffect(() => {
    if (!container) return

    const ro = new ResizeObserver((entries) => {
      invariant(entries.length === 1)
      const entry = entries.at(0)
      invariant(entry)
      viewport$.next(
        new Vec2(entry.contentRect.width, entry.contentRect.height),
      )
    })

    ro.observe(container)
    return () => {
      ro.disconnect()
    }
  }, [container])
}
