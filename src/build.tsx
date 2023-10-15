import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import invariant from 'tiny-invariant'
import styles from './build.module.scss'
import { setBuildEntityType } from './state.js'
import { EntityType } from './types.js'

function BuildButton() {
  return <button className={styles['build-button']}>BUILD</button>
}

export function Build() {
  const { entityType } = useParams<{ entityType: EntityType }>()
  invariant(entityType)
  invariant(Object.values(EntityType).includes(entityType))

  useEffect(() => {
    setBuildEntityType(entityType)
    return () => {
      setBuildEntityType(null)
    }
  }, [entityType])

  return (
    <div className={styles.build}>
      <BuildButton />
    </div>
  )
}
