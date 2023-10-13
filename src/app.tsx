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
import { GridContainer } from './grid-container.js'

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
