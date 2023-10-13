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
  scan,
  startWith,
  tap,
} from 'rxjs'
import invariant from 'tiny-invariant'
import styles from './app.module.scss'
import { Vec2 } from './vec2.js'

interface Camera {
  position: Vec2
  zoom: number
}

const wheel$ = new BehaviorSubject<number>(0)

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

const MIN_ZOOM = 0
const MAX_ZOOM = 1

const zoom$ = wheel$.pipe(
  startWith(0.5),
  scan((acc, delta) => {
    return clamp(acc + delta / -1000, MIN_ZOOM, MAX_ZOOM)
  }),
  tap((zoom) => {
    invariant(zoom >= MIN_ZOOM && zoom <= MAX_ZOOM)
  }),
)

const camera$ = new BehaviorSubject<Camera>({
  position: new Vec2(),
  zoom: 0.5,
})
const pointer$ = new Subject<PointerEvent>()

pointer$.pipe(pairwise()).subscribe(([prev, next]) => {
  if (next.type === 'pointermove' && next.pressure > 0) {
    const { zoom, position } = camera$.value
    const cellSize = getCellSize(zoom)
    const delta = new Vec2(next.clientX, next.clientY)
      .sub(new Vec2(prev.clientX, prev.clientY))
      .mul(-1)
      .div(cellSize)

    camera$.next({
      position: position.add(delta),
      zoom,
    })
  }
})

const [useCamera] = bind(camera$)

const viewport$ = new BehaviorSubject<Vec2>(new Vec2())
const [useViewport] = bind(viewport$)

const [useZoom] = bind(zoom$)

const MAX_CELL_SIZE = 100
const MIN_CELL_SIZE = 20

function GridContainer() {
  const camera = useCamera()
  const viewport = useViewport()
  const zoom = useZoom()

  const cellSize = getCellSize(zoom)

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
        pointer$.next(e)
      },
      { signal },
    )

    container.addEventListener(
      'pointerleave',
      (e) => {
        pointer$.next(e)
      },
      { signal },
    )

    container.addEventListener(
      'wheel',
      (e) => {
        wheel$.next(e.deltaY)
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
  zoom,
}: {
  screen: Vec2
  viewport: Vec2
  camera: Camera
  zoom: number
}): Vec2 {
  const cellSize = getCellSize(zoom)
  return screen.sub(viewport.div(2)).div(cellSize).add(camera.position)
}

function worldToScreen({
  world,
  viewport,
  camera,
  zoom,
}: {
  world: Vec2
  viewport: Vec2
  camera: Camera
  zoom: number
}): Vec2 {
  const cellSize = getCellSize(zoom)
  return world.sub(camera.position).mul(cellSize).add(viewport.div(2))
}

const hover$ = combineLatest([pointer$, viewport$, camera$, zoom$]).pipe(
  map(([pointer, viewport, camera, zoom]) => {
    if (pointer.type === 'pointerleave' || pointer.type === 'pointerout') {
      return null
    }

    return screenToWorld({
      screen: new Vec2(pointer.clientX, pointer.clientY),
      viewport,
      camera,
      zoom,
    })
  }),
  startWith(null),
)
const [useHover] = bind(hover$)

function HoverContainer() {
  const hover = useHover()
  const zoom = useZoom()
  const viewport = useViewport()
  const camera = useCamera()

  const screen = hover
    ? worldToScreen({
        world: hover.floor(),
        camera,
        viewport,
        zoom,
      })
    : new Vec2()

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear()
      if (hover) {
        const cellSize = getCellSize(zoom)
        g.lineStyle(2, 'red')
        g.drawRect(0, 0, cellSize, cellSize)
      }
    },
    [hover, zoom],
  )

  return <Graphics draw={draw} position={screen} />
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

function getCellSize(zoom: number): number {
  return MIN_CELL_SIZE + (MAX_CELL_SIZE - MIN_CELL_SIZE) * zoom
}
