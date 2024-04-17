import {describe, expect, it } from 'vitest';
import {createState, keyOfEntity} from 'src'
import { avatarLayer, headerLayer, rootLayer, sizeVariable } from '../helpers'

export const inspectFieldsTest = () => {
  const statex = createState()
  const entities = [rootLayer, headerLayer, avatarLayer, sizeVariable]
  entities.forEach(el => statex.mutate(el))

  describe('inspectFields', () => {
    it('should return all layers', () => {
      expect(statex.inspectFields('Layer')).toStrictEqual([rootLayer, headerLayer, avatarLayer].map(keyOfEntity))
    })

    it('should return all variables', () => {
      expect(statex.inspectFields('Variable')).toStrictEqual([sizeVariable].map(keyOfEntity))
    })

    it('invalid entityType', () => {
      expect(statex.inspectFields(10)).toStrictEqual([])
      expect(statex.inspectFields()).toStrictEqual([])
    })
  })
}
