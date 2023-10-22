import { useNavigate } from 'react-router-dom'
import styles from './configure-build.module.scss'
import { EntityType } from './types.js'

const ENTITY_TYPES: EntityType[] = [
  EntityType.House,
  EntityType.Farm,
  EntityType.Storage,
]

export function ConfigureBuild() {
  const navigate = useNavigate()

  return (
    <div className={styles.container}>
      {ENTITY_TYPES.map((entityType) => (
        <button
          key={entityType}
          className={styles.button}
          onPointerUp={() => {
            navigate(entityType)
          }}
        >
          {entityType}
        </button>
      ))}
    </div>
  )
}
