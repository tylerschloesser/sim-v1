import { useParams } from 'react-router-dom'
import styles from './build.module.scss'
import invariant from 'tiny-invariant'
import { EntityType } from './types.js'
import { useEffect } from 'react'
import { build$ } from './state.js'

export function Build() {
  const { entityType } = useParams<{ entityType: EntityType }>()
  invariant(entityType)
  invariant(Object.values(EntityType).includes(entityType))

  useEffect(() => {
    build$.next({ entityType })
    return build$.next(null)
  }, [entityType])

  return <div className={styles.build}>todo build {entityType}</div>
}
