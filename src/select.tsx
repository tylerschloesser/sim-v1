import { useCallback, useEffect, useMemo } from 'react'
import invariant from 'tiny-invariant'
import styles from './select.module.scss'
import {
  graphics$,
  jobs$,
  select$,
  useEntities,
  useSelectedEntityIds,
} from './state.js'
import { CutTreesJob, Entity, EntityType, JobType } from './types.js'
import { getNextJobId } from './util.js'
import { useNavigate } from 'react-router-dom'
import { combineLatest } from 'rxjs'

const EMPTY_SET = new Set<string>()

export function Select() {
  const entities = useEntities()
  const selectedEntityIds = useSelectedEntityIds() ?? EMPTY_SET
  const navigate = useNavigate()

  useEffect(() => {
    return () => {
      select$.next(null)
    }
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

  const cutTrees = useCallback(() => {
    const trees = selectedEntities[EntityType.Tree]
    invariant(trees)
    invariant(trees.length > 0)
    const job: CutTreesJob = {
      id: getNextJobId(),
      entityIds: trees.map(({ id }) => id),
      type: JobType.CutTrees,
    }

    jobs$.next({
      ...jobs$.value,
      [job.id]: job,
    })

    navigate('/')
  }, [selectedEntities, navigate])

  const trees = selectedEntities[EntityType.Tree] ?? []

  return (
    <div className={styles.select}>
      {!selectedEntityIds?.size && <>nothing selected</>}
      {selectedEntityIds?.size === 1 && <>1 entity selected</>}
      {(selectedEntityIds?.size ?? 0) > 1 && (
        <>{selectedEntityIds?.size} entities selected</>
      )}

      {trees.length > 0 && (
        <button onPointerUp={cutTrees}>
          CUT {trees.length} TREE{trees.length > 1 ? 'S' : ''}
        </button>
      )}
    </div>
  )
}

combineLatest([select$, graphics$]).subscribe(([select, graphics]) => {
  graphics.renderSelect(select)
})
