import invariant from 'tiny-invariant'
import { agents$, chunks$, entities$, jobs$ } from './state.js'
import { Vec2 } from './vec2.js'
import { getCell } from './util.js'

export function tickWorld() {
  const entities = entities$.value
  const agents = agents$.value
  const jobs = jobs$.value
  const chunks = chunks$.value

  for (const agent of Object.values(agents)) {
    if (!agent.jobId) {
      if (Object.values(jobs).length > 0) {
        const job = Object.values(jobs).at(0)
        invariant(job)
        agent.jobId = job.id
      }
    }

    if (!agent.jobId) {
      return
    }

    const job = jobs[agent.jobId]
    invariant(job)

    const entityId = job.entityIds.at(0)
    invariant(entityId)

    const entity = entities[entityId]
    invariant(entity)

    if (Vec2.isEqual(entity.position, agent.position)) {
      delete entities[entity.id]
      for (let y = 0; y < entity.size.y; y++) {
        for (let x = 0; x < entity.size.x; x++) {
          const cell = getCell(chunks, entity.position.add(new Vec2(x, y)))
          delete cell.entityId
        }
      }

      job.entityIds.shift()
      if (job.entityIds.length === 0) {
        delete jobs[job.id]
      }
      delete agent.jobId

      entities$.next({ ...entities })
      chunks$.next({ ...chunks })
      jobs$.next({ ...jobs })
    } else {
      const delta = entity.position.sub(agent.position)
      const speed = 1

      if (delta.dist() <= speed) {
        agent.position = entity.position
      } else {
        const velocity = delta.norm().mul(speed)
        agent.position = agent.position.add(velocity)
      }
    }

    agents$.next({ ...agents })
  }
}
