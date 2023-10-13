import { BlurFilter } from 'pixi.js'
import { Stage, Container, Sprite, Text, Graphics } from '@pixi/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BehaviorSubject } from 'rxjs'
import * as PIXI from 'pixi.js'
import { Subscribe, bind } from '@react-rxjs/core'
import invariant from 'tiny-invariant'

import styles from './app.module.scss'
type Vec2 = [number, number]

const pointer$ = new BehaviorSubject<Vec2 | null>(null)
const [usePointer] = bind(pointer$)

const position$ = new BehaviorSubject<Vec2>([0, 0])
const [usePosition] = bind(position$)

const viewport$ = new BehaviorSubject<Vec2>([0, 0])
const [useViewport] = bind(viewport$)

const zoom$ = new BehaviorSubject<number>(0.5)
const [useZoom] = bind(zoom$)

function GridContainer() {
  const position = usePosition()
  const viewport = useViewport()
  const zoom = useZoom()

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear()

      g.lineStyle({
        width: 1,
        color: '0xFFFFFF11',
      })

      const cellSize = 100

      const cols = Math.ceil(viewport[0] / cellSize)
      const rows = Math.ceil(viewport[1] / cellSize)

      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          g.moveTo(position[0] + col * cellSize, position[1])
          g.lineTo(position[0] + col * cellSize, position[1] + viewport[1])

          g.moveTo(position[0], position[1] + row * cellSize)
          g.lineTo(position[0] + viewport[0], position[1] + row * cellSize)
        }
      }
    },
    [position, viewport, zoom],
  )

  return <Graphics draw={draw} />
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
        pointer$.next([e.clientX, e.clientY])
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
        const [x, y] = pointer
        g.beginFill('red')
        g.drawCircle(x, y, 10)
      }
    },
    [pointer],
  )

  return <Graphics draw={draw} />
}
