import { useEffect } from 'react'
import invariant from 'tiny-invariant'
import { blur$, keyboard$, pointer$, viewport$, wheel$ } from './state.js'
import { hackPointerEvent } from './util.js'
import { Vec2 } from './vec2.js'

export function useEventListeners(container: HTMLDivElement | null) {
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

    window.addEventListener(
      'keyup',
      (e) => {
        keyboard$.next(e)
      },
      { signal },
    )

    window.addEventListener(
      'keydown',
      (e) => {
        keyboard$.next(e)
      },
      { signal },
    )

    window.addEventListener(
      'blur',
      () => {
        blur$.next()
      },
      { signal },
    )

    return () => {
      ac.abort()
    }
  }, [container])
}

export function useResizeObserver(container: HTMLDivElement | null) {
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
