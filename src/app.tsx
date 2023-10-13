import { Container, Graphics, Sprite, Stage, Text } from '@pixi/react'
import { Subscribe, bind } from '@react-rxjs/core'
import * as PIXI from 'pixi.js'
import { BlurFilter } from 'pixi.js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  pairwise,
  scan,
  startWith,
  tap,
} from 'rxjs'
import invariant from 'tiny-invariant'
import styles from './app.module.scss'
import { Vec2 } from './vec2.js'

interface Pointer {
  position: Vec2
  down: boolean
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

const pointer$ = new BehaviorSubject<Pointer | null>(null)
const [usePointer] = bind(pointer$)

const position$ = pointer$.pipe(
  pairwise(),
  map(([prev, next]) => {
    if (!(prev?.down && next?.down)) return null
    const delta = new Vec2(
      next.position.x - prev.position.x,
      next.position.y - prev.position.y,
    )
    return delta
  }),
  filter((delta: Vec2 | null): delta is Vec2 => delta !== null),
  scan<Vec2, Vec2>((acc, delta) => {
    return new Vec2(acc.x + delta.x, acc.y + delta.y)
  }, new Vec2()),
  startWith(new Vec2()),
)

const [usePosition] = bind(position$)

const viewport$ = new BehaviorSubject<Vec2>(new Vec2())
const [useViewport] = bind(viewport$)

const [useZoom] = bind(zoom$)

const MAX_CELL_SIZE = 100
const MIN_CELL_SIZE = 20

function mod(n: number, m: number) {
  return ((n % m) + m) % m
}

function GridContainer() {
  const position = usePosition()
  const viewport = useViewport()
  const zoom = useZoom()

  const cellSize = getCellSize(zoom)

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear()

      g.lineStyle({
        width: 1,
        color: '0x111',
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
      position={[
        mod(position.x, cellSize) - cellSize,
        mod(position.y, cellSize) - cellSize,
      ]}
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
            <PointerContainer />
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
        pointer$.next({
          position: new Vec2(e.clientX, e.clientY),
          down: e.pressure > 0,
        })
      },
      { signal },
    )

    container.addEventListener(
      'pointerleave',
      () => {
        pointer$.next(null)
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

const hover$ = combineLatest([pointer$, viewport$, position$, zoom$]).pipe(
  map(([pointer, viewport, position, zoom]) => {
    return null
  }),
)
const [useHover] = bind(hover$)

function PointerContainer() {
  const pointer = usePointer()
  const viewport = useViewport()
  const zoom = useZoom()

  const cellSize = getCellSize(zoom)

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear()

      if (pointer) {
        const { x, y } = pointer.position
        g.beginFill('red')
        g.drawCircle(x, y, 10)
      }
    },
    [pointer],
  )

  return <Graphics draw={draw} />
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
