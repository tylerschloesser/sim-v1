import styles from './debug-overlay.module.scss'
import { useAverageTickDuration } from './debug.js'
import { useVisibleChunkIds } from './state.js'

export function DebugOverlay() {
  const averageTickDuration = useAverageTickDuration()
  const visibleChunkIds = useVisibleChunkIds()

  return (
    <div className={styles.container}>
      <div>Avg Tick: {averageTickDuration.toFixed(2)}ms</div>
      <div>Visible Chunks: {visibleChunkIds.size}</div>
    </div>
  )
}
