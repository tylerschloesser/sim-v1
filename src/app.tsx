import { BlurFilter } from 'pixi.js'
import { Stage, Container, Sprite, Text, Graphics } from '@pixi/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BehaviorSubject } from 'rxjs'
import * as PIXI from 'pixi.js'
import { Subscribe, bind } from '@react-rxjs/core'

import styles from './app.module.scss'

type Container = HTMLDivElement | null

type Vec2 = [number, number]

const pointer$ = new BehaviorSubject<Vec2 | null>(null)

const [usePointer] = bind(pointer$)

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

  return (
    <Container>
      <Graphics draw={draw} />
    </Container>
  )
}

export function App() {
  const blurFilter = useMemo(() => new BlurFilter(4), [])

  const [container, setContainer] = useState<Container>(null)
  const rect = container?.getBoundingClientRect()
  useEventListeners(container)

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

function useEventListeners(container: Container) {
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
