import { Container } from 'pixi.js'
import { Entity } from './types.js'

export abstract class EntityContainer extends Container {
  abstract update(entity: Entity): void
}
