import styles from './debug-overlay.module.scss'
import { useAverageTickDuration } from './debug.js'

export function DebugOverlay() {
  const averageTickDuration = useAverageTickDuration()

  return (
    <div className={styles.container}>
      Avg Tick: {averageTickDuration.toFixed(2)}ms
    </div>
  )
}
