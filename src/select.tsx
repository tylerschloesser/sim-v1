import styles from './select.module.scss'
import { useSelectedEntityIds } from './state.js'
export function Select() {
  const selectedEntityIds = useSelectedEntityIds()

  return (
    <div className={styles.select}>
      {!selectedEntityIds?.size && <>nothing selected</>}
      {selectedEntityIds?.size === 1 && <>1 entity selected</>}
      {(selectedEntityIds?.size ?? 0) > 1 && (
        <>{selectedEntityIds?.size} entities selected</>
      )}
    </div>
  )
}
