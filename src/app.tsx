import { Container, Graphics, Sprite, Stage, Text } from '@pixi/react'
import { Subscribe, bind } from '@react-rxjs/core'
import * as PIXI from 'pixi.js'
import { BlurFilter } from 'pixi.js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BehaviorSubject, filter, map, pairwise, scan, startWith } from 'rxjs'
import invariant from 'tiny-invariant'

import styles from './app.module.scss'
type Vec2 = [number, number]

interface Pointer {
  position: Vec2
  down: boolean
}

const pointer$ = new BehaviorSubject<Pointer | null>(null)
const [usePointer] = bind(pointer$)

const position$ = pointer$.pipe(
  pairwise(),
  map(([prev, next]) => {
    if (!(prev?.down && next?.down)) return null
    const delta: Vec2 = [
      next.position[0] - prev.position[0],
      next.position[1] - prev.position[1],
    ]
    return delta
  }),
  filter((delta: Vec2 | null): delta is Vec2 => delta !== null),
  scan<Vec2, Vec2>(
    (acc, delta) => {
      const next: Vec2 = [acc[0] + delta[0], acc[1] + delta[1]]
      return next
    },
    [0, 0],
  ),
  startWith([0, 0] as Vec2),
)

const [usePosition] = bind(position$)

const viewport$ = new BehaviorSubject<Vec2>([0, 0])
const [useViewport] = bind(viewport$)

const zoom$ = new BehaviorSubject<number>(0.5)
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

  invariant(zoom >= 0 && zoom <= 1)
  const cellSize = MIN_CELL_SIZE + (MAX_CELL_SIZE - MIN_CELL_SIZE) * zoom

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear()

      g.lineStyle({
        width: 1,
        color: '0xFFFFFF11',
      })

      const cols = Math.ceil(viewport[0] / cellSize) + 1
      const rows = Math.ceil(viewport[1] / cellSize) + 1

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
        mod(position[0], cellSize) - cellSize,
        mod(position[1], cellSize) - cellSize,
      ]}
    />
  )
}

export function App() {
  const blurFilter = useMemo(() => new BlurFilter(4), [])

  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const rect = container?.getBoundingClientRect()
  useEventListeners(container)

  useEffect(() => {
    if (!container) return

    const ro = new ResizeObserver((entries) => {
      invariant(entries.length === 1)
      const entry = entries.at(0)
      invariant(entry)
      viewport$.next([entry.contentRect.width, entry.contentRect.height])
    })

    ro.observe(container)
    return () => {
      ro.disconnect()
    }
  }, [container])

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
          position: [e.clientX, e.clientY],
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
        console.log('wheel')

        e.preventDefault()
      },
      { signal, passive: false },
    )

    return () => {
      ac.abort()
    }
  }, [container])
}

function PointerContainer() {
  const pointer = usePointer()

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear()

      if (pointer) {
        const [x, y] = pointer.position
        g.beginFill('red')
        g.drawCircle(x, y, 10)
      }
    },
    [pointer],
  )

  return <Graphics draw={draw} />
}
