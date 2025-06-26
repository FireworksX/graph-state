import type { Entity, Graph } from 'src'
import { isObject } from 'src'
import { keyOfEntity } from './keyOfEntity'

export const entityOfKey = (entity?: Entity) => {
  if (isObject(entity) && (entity as any)?._type && keyOfEntity(entity)) {
    return entity as any as Graph
  }
  if (!entity || typeof entity !== 'string') return null

  const [typeName, ...restTypes] = entity.split(':')
  if (!typeName || restTypes.length < 1) return null

  return {
    _type: typeName,
    _id: restTypes.join(':'),
  }
}
