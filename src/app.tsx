import { BlurFilter } from 'pixi.js'
import { Stage, Container, Sprite, Text } from '@pixi/react'
import { useEffect, useMemo, useState } from 'react'

import styles from './app.module.scss'

type Container = HTMLDivElement | null

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
      () => {
        console.log('pointermove')
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
