import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import invariant from 'tiny-invariant'
import styles from './build.module.scss'
import { setBuildEntityType, useBuild } from './state.js'
import { EntityType } from './types.js'

function BuildButton({ disabled }: { disabled: boolean }) {
  return (
    <button disabled={disabled} className={styles['build-button']}>
      BUILD
    </button>
  )
}

export function Build() {
  const build = useBuild()

  const { entityType } = useParams<{ entityType: EntityType }>()
  invariant(entityType)
  invariant(Object.values(EntityType).includes(entityType))

  useEffect(() => {
    setBuildEntityType(entityType)
    return () => {
      setBuildEntityType(null)
    }
  }, [entityType])

  if (build === null) return null

  return (
    <div className={styles.build}>
      <BuildButton disabled={!build.valid} />
    </div>
  )
}
