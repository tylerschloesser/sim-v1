import { BlurFilter } from 'pixi.js'
import { Stage, Container, Sprite, Text } from '@pixi/react'
import { useMemo, useState } from 'react'

import styles from './app.module.scss'

export function App() {
  const blurFilter = useMemo(() => new BlurFilter(4), [])

  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const rect = container?.getBoundingClientRect()

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
