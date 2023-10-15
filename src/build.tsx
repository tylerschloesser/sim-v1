import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import invariant from 'tiny-invariant'
import styles from './build.module.scss'
import { confirmBuild, setBuildEntityType, useBuild } from './state.js'
import { BuildState, EntityType } from './types.js'

function BuildButton({ build }: { build: BuildState }) {
  let onPointerUp

  if (build.valid) {
    onPointerUp = () => {
      confirmBuild(build)
    }
  }

  return (
    <button
      disabled={!build.valid}
      className={styles['build-button']}
      onPointerUp={onPointerUp}
    >
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
      <BuildButton build={build} />
    </div>
  )
}
