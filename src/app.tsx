import { Stage } from '@pixi/react'
import { Subscribe } from '@react-rxjs/core'
import { useState } from 'react'
import styles from './app.module.scss'
import { GridContainer } from './grid-container.js'
import { HoverContainer } from './hover-container.js'
import { useEventListeners, useResizeObserver } from './app.hooks.js'

export function App() {
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
            <GridContainer />
            <HoverContainer />
          </Subscribe>
        </Stage>
      )}
    </div>
  )
}
