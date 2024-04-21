import { describe, expect, it } from 'vitest'
import { createState, keyOfEntity } from 'src'
import { avatarLayer, headerLayer, rootLayer, sizeVariable } from '../helpers'

describe('createState', () => {
  const graphState = createState()
  const entities = [rootLayer, headerLayer, avatarLayer, sizeVariable]
  entities.forEach(el => graphState.mutate(el))

  describe('inspectFields', () => {
    it('should return all layers', () => {
      expect(graphState.inspectFields('Layer')).toStrictEqual([rootLayer, headerLayer, avatarLayer].map(keyOfEntity))
    })

    it('should return all variables', () => {
      expect(graphState.inspectFields('Variable')).toStrictEqual([sizeVariable].map(keyOfEntity))
    })

    it('invalid entityType', () => {
      expect(graphState.inspectFields(10)).toStrictEqual([])
      expect(graphState.inspectFields()).toStrictEqual([])
    })
  })
})
