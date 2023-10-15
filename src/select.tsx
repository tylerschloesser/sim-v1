import { useEffect, useMemo } from 'react'
import styles from './select.module.scss'
import { select$, useEntities, useSelectedEntityIds } from './state.js'
import { Entity, EntityType } from './types.js'
import invariant from 'tiny-invariant'

const EMPTY_SET = new Set<string>()

export function Select() {
  const entities = useEntities()
  const selectedEntityIds = useSelectedEntityIds() ?? EMPTY_SET

  useEffect(() => {
    select$.next(null)
  }, [])

  const selectedEntities = useMemo(() => {
    const result: Partial<Record<EntityType, Entity[]>> = {}
    for (const entityId of selectedEntityIds) {
      const entity = entities[entityId]
      invariant(entity)
      result[entity.type] = [...(result[entity.type] ?? []), entity]
    }
    return result
  }, [entities, selectedEntityIds])

  const trees = selectedEntities[EntityType.Tree] ?? []

  return (
    <div className={styles.select}>
      {!selectedEntityIds?.size && <>nothing selected</>}
      {selectedEntityIds?.size === 1 && <>1 entity selected</>}
      {(selectedEntityIds?.size ?? 0) > 1 && (
        <>{selectedEntityIds?.size} entities selected</>
      )}

      {trees.length > 0 && (
        <button>
          CUT {trees.length} TREE{trees.length > 1 ? 'S' : ''}
        </button>
      )}
    </div>
  )
}
