import type { Entity, LinkKey } from 'src'
import { isValue } from '@graph-state/checkers'
import { entityOfKey } from './entityOfKey'

export const keyOfEntity = (entity: Entity) => {
  if (typeof entity === 'string') {
    return entityOfKey(entity) ? (entity as LinkKey) : null
  }
  if (!entity?._type) {
    return null
  }

  let entityId: LinkKey | null = null

  // if (entity._type in keys) {
  //   entityId = keys[entity._type]?.(entity) ?? null
  // } else
  if (isValue(entity.id) || isValue(entity._id)) {
    entityId = `${entity.id ?? entity._id}`
  }

  return !entityId ? entityId : (`${entity._type}:${entityId}` as LinkKey)
}
