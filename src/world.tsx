import { Container, Stage } from '@pixi/react'
import { Subscribe } from '@react-rxjs/core'
import { useState } from 'react'
import styles from './world.module.scss'
import { GridContainer } from './grid-container.js'
import { HoverContainer } from './hover-container.js'
import { useEventListeners, useResizeObserver } from './world.hooks.js'
import { ChunkContainer } from './chunk-container.js'
import { useCamera, useViewport } from './state.js'
import { getCellSize } from './util.js'

function WorldContainer({ children }: React.PropsWithChildren<{}>) {
  const camera = useCamera()
  const viewport = useViewport()
  const cellSize = getCellSize(camera.zoom)
  return (
    <Container
      position={camera.position.mul(cellSize * -1).add(viewport.div(2))}
      scale={cellSize}
    >
      {children}
    </Container>
  )
}

function BottomMenu() {
  return (
    <div className={styles['bottom-menu']}>
      <button
        className={styles['build-button']}
        onPointerUp={(e) => {
          console.log('todo build')
          e.preventDefault()
        }}
      >
        BUILD
      </button>
    </div>
  )
}

export function World() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const rect = container?.getBoundingClientRect()
  useEventListeners(container)
  useResizeObserver(container)

  return (
    <div className={styles.world} ref={setContainer}>
      {container && (
        <Stage
          width={rect?.width}
          height={rect?.height}
          className={styles.canvas}
          options={{
            resizeTo: container,
            antialias: true,
          }}
        >
          <Subscribe>
            <WorldContainer>
              <ChunkContainer />
              <GridContainer />
            </WorldContainer>
            <HoverContainer />
          </Subscribe>
        </Stage>
      )}
      <BottomMenu />
    </div>
  )
}
