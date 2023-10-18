import { Container, Stage } from '@pixi/react'
import { Subscribe } from '@react-rxjs/core'
import { useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { AgentContainer } from './agent-container.js'
import { BuildContainer } from './build-container.js'
import { ChunkContainer } from './chunk-container.js'
import { EntityContainer } from './entity-container.js'
import { Graphics } from './graphics.js'
import { GridContainer } from './grid-container.js'
import { HoverContainer } from './hover-container.js'
import { SelectContainer } from './select-container.js'
import { SelectedEntityContainer } from './selected-entity-container.js'
import {
  confirmBuild,
  navigate$,
  setGraphics,
  updates$,
  useCamera,
  useViewport,
} from './state.js'
import { tickWorld } from './tick.js'
import { EntityType } from './types.js'
import { getCellSize } from './util.js'
import { Vec2 } from './vec2.js'
import { useEventListeners, useResizeObserver } from './world.hooks.js'
import styles from './world.module.scss'

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
  const graphics = useRef<Graphics>()
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
      const updates = tickWorld()
      updates$.next(updates)
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
    if (graphics.current) {
      graphics.current.destroy()
      graphics.current = undefined
    }
    if (!canvas || !container) {
      return
    }
    graphics.current = new Graphics({ canvas, container })
    setGraphics(graphics.current)
    return () => {
      graphics.current?.destroy()
      graphics.current = undefined
    }
  }, [canvas, container])

  const [v1, setV1] = useState(false)
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === 't') {
        setV1((prev) => !prev)
      }
    }
    window.addEventListener('keyup', listener)
    return () => {
      window.removeEventListener('keyup', listener)
    }
  }, [])

  useEffect(() => {
    console.log(v1 ? 'v1' : 'v2')
  }, [v1])

  return (
    <div className={styles.world} ref={setContainer}>
      <canvas ref={setCanvas} className={styles['canvas-v2']}></canvas>
      {container && v1 && (
        <Stage
          width={rect?.width}
          height={rect?.height}
          className={styles.canvas}
          options={{
            backgroundAlpha: 0,
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
