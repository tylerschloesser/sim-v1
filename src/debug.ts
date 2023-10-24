import { bind } from '@react-rxjs/core'
import { BehaviorSubject } from 'rxjs'

let i = 0
const tickDurationCache = new Array<number>(10).fill(0)

const averageTickDuration$ = new BehaviorSubject<number>(0)
export const [useAverageTickDuration] = bind(averageTickDuration$)

export function logTickDuration(duration: number): void {
  tickDurationCache[i] = duration
  i = (i + 1) % 10

  if (i === 0) {
    const average = tickDurationCache.reduce((acc, v) => acc + v, 0) / 10
    averageTickDuration$.next(average)
  }
}
