import { Stage } from '@pixi/react'
import { Subscribe } from '@react-rxjs/core'
import { useEffect, useState } from 'react'
import invariant from 'tiny-invariant'
import styles from './app.module.scss'
import { GridContainer } from './grid-container.js'
import { HoverContainer } from './hover-container.js'
import { pointer$, viewport$, wheel$ } from './state.js'
import { hackPointerEvent } from './util.js'
import { Vec2 } from './vec2.js'

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
