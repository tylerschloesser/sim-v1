import { Graphics, Stage } from '@pixi/react'
import { Subscribe } from '@react-rxjs/core'
import * as PIXI from 'pixi.js'
import { useCallback, useEffect, useState } from 'react'
import invariant from 'tiny-invariant'
import styles from './app.module.scss'
import {
  pointer$,
  useCamera,
  useHover,
  useViewport,
  viewport$,
  wheel$,
} from './state.js'
import { getCellSize, hackPointerEvent, worldToScreen } from './util.js'
import { Vec2 } from './vec2.js'

function GridContainer() {
  const camera = useCamera()
  const viewport = useViewport()
  const cellSize = getCellSize(camera.zoom)

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear()

      g.lineStyle({
        width: 1,
        color: '0x222',
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
      position={camera.position
        .mul(-1)
        .mul(cellSize)
        .add(viewport.div(2))
        .mod(cellSize)
        .sub(cellSize)}
    />
  )
}

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
            <HoverContainer />
            <GridContainer />
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
        pointer$.next(hackPointerEvent(e))
      },
      { signal },
    )

    container.addEventListener(
      'pointerleave',
      (e) => {
        pointer$.next(hackPointerEvent(e))
      },
      { signal },
    )

    container.addEventListener(
      'wheel',
      (e) => {
        wheel$.next(e)
        e.preventDefault()
      },
      { signal, passive: false },
    )

    return () => {
      ac.abort()
    }
  }, [container])
}

function HoverContainer() {
  const hover = useHover()
  const viewport = useViewport()
  const camera = useCamera()
  const cellSize = getCellSize(camera.zoom)

  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear()
      g.lineStyle(2, 'red')
      g.drawRect(0, 0, cellSize, cellSize)
    },
    [cellSize],
  )

  if (hover === null) return null

  return (
    <Graphics
      draw={draw}
      position={worldToScreen({
        world: hover.floor(),
        camera,
        viewport,
      })}
    />
  )
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
