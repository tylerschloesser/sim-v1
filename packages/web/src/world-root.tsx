import { useNavigate } from 'react-router-dom'
import styles from './world-root.module.scss'

export function WorldRoot() {
  const navigate = useNavigate()
  return (
    <div className={styles['world-root']}>
      <button
        className={styles['build-button']}
        onPointerUp={() => {
          navigate('build')
        }}
      >
        BUILD
      </button>
      <button
        className={styles['select-button']}
        onPointerUp={() => {
          navigate('select')
        }}
      >
        SELECT
      </button>
    </div>
  )
}
