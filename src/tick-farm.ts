import invariant from 'tiny-invariant'
import { FarmEntity, World, WorldUpdates } from './types.js'

export function tickFarm(
  world: World,
  updates: WorldUpdates,
  farm: FarmEntity,
): void {
  for (const cell of farm.cells) {
    const lastMaturity = cell.maturity
    cell.maturity += (1 / (5 * 10)) * (cell.water ? 1 : 0.25)

    if (lastMaturity < 1 && cell.maturity >= 1) {
      // ready to pick
      invariant(cell.maturity < 1.5)
    } else if (lastMaturity < 1.5 && cell.maturity >= 1.5) {
      // dead
    }

    if (cell.water > 0) {
      cell.water = Math.max(cell.water - 1 / (60 * 10), 0)
    }
  }

  world.entities[farm.id] = { ...farm }

  // TODO only update when needed?
  updates.entityIds.add(farm.id)
}
