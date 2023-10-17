import { Container, Stage } from '@pixi/react'
import { Subscribe } from '@react-rxjs/core'
import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { ChunkContainer } from './chunk-container.js'
import { GridContainer } from './grid-container.js'
import { HoverContainer } from './hover-container.js'
import { confirmBuild, navigate$, useCamera, useViewport } from './state.js'
import { getCellSize } from './util.js'
import { useEventListeners, useResizeObserver } from './world.hooks.js'
import styles from './world.module.scss'
import { BuildContainer } from './build-container.js'
import { EntityContainer } from './entity-container.js'
import { AgentContainer } from './agent-container.js'
import { SelectContainer } from './select-container.js'
import { tickWorld } from './tick.js'
import { SelectedEntityContainer } from './selected-entity-container.js'
import { EntityType } from './types.js'
import { Vec2 } from './vec2.js'
import { initGraphics } from './graphics.js'

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

export function World() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const rect = container?.getBoundingClientRect()
  useEventListeners(container)
  useResizeObserver(container)

  const navigate = useNavigate()
  useEffect(() => {
    navigate$.next(navigate)
    return () => {
      navigate$.next(null)
    }
  }, [navigate])

  useEffect(() => {
    const interval = window.setInterval(() => {
      tickWorld()
    }, 100)
    return () => {
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    confirmBuild({
      entityType: EntityType.Farm,
      position: new Vec2(2, 0),
      size: new Vec2(4),
      valid: true,
      force: true,
    })
  }, [])

  useEffect(() => {
    if (!canvas || !container) return
    initGraphics({ canvas, container })
  }, [canvas, container])

  return (
    <div className={styles.world} ref={setContainer}>
      <canvas ref={setCanvas} className={styles['canvas-v2']}></canvas>
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
              <EntityContainer />
              <SelectedEntityContainer />
              <AgentContainer />
              <BuildContainer />
              <SelectContainer />
              <GridContainer />
            </WorldContainer>
            <HoverContainer />
          </Subscribe>
        </Stage>
      )}
      <Outlet />
    </div>
  )
}
