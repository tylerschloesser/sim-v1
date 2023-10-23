import { useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Graphics } from './graphics.js'
import { confirmBuild, navigate$, setGraphics, updates$ } from './state.js'
import { tickWorld } from './tick.js'
import { EntityType } from './types.js'
import { Vec2 } from './vec2.js'
import { useEventListeners, useResizeObserver } from './world.hooks.js'
import styles from './world.module.scss'

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

  return (
    <div className={styles.world} ref={setContainer}>
      <canvas ref={setCanvas} className={styles['canvas-v2']}></canvas>
      <Outlet />
    </div>
  )
}
