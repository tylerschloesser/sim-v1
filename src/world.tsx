import { useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Graphics } from './graphics.js'
import { confirmBuild, navigate$, setGraphics, updates$ } from './state.js'
import { tickWorld } from './tick.js'
import { EntityType } from './types.js'
import { Vec2 } from './vec2.js'
import { useEventListeners, useResizeObserver } from './world.hooks.js'
import styles from './world.module.scss'
import { logTickDuration } from './debug.js'
import { DebugOverlay } from './debug-overlay.js'
import { FARM_SIZE, HOUSE_SIZE, STORAGE_SIZE, WELL_SIZE } from './const.js'

export function World() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
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
      window.performance.mark('tick-start')
      const updates = tickWorld()
      window.performance.mark('tick-end')

      logTickDuration(
        window.performance.measure('tick-duration', 'tick-start', 'tick-end')
          .duration,
      )

      updates$.next(updates)
    }, 100)
    return () => {
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    confirmBuild({
      entityType: EntityType.Farm,
      position: new Vec2(-2, -2),
      size: FARM_SIZE,
      valid: true,
      force: true,
    })
    confirmBuild({
      entityType: EntityType.Well,
      position: new Vec2(-1, -6),
      size: WELL_SIZE,
      valid: true,
      force: true,
    })
    confirmBuild({
      entityType: EntityType.House,
      position: new Vec2(-5, -1),
      size: HOUSE_SIZE,
      valid: true,
      force: true,
    })
    confirmBuild({
      entityType: EntityType.Storage,
      position: new Vec2(-4, 4),
      size: STORAGE_SIZE,
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

  return (
    <div className={styles.world} ref={setContainer}>
      <canvas ref={setCanvas} className={styles['canvas-v2']}></canvas>
      <Outlet />
      <DebugOverlay />
    </div>
  )
}
