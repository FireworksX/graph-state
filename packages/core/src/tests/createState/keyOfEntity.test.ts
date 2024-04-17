import {describe, expect, it } from 'vitest';
import {createState, keyOfEntity} from 'src'
import { rootLayer } from '../helpers'

export const keyOfEntityTest = () => {
  const statex = createState()

  describe('keyOfEntity', () => {
    it('should return key', () => {
      expect(keyOfEntity(rootLayer)).toEqual('Layer:root')
    })

    it('should skip parsing', () => {
      expect(keyOfEntity('Layer:root')).toEqual('Layer:root')
    })

    it('invalid entityType', () => {
      expect(keyOfEntity('Layer')).toStrictEqual(null)
      expect(keyOfEntity(10)).toStrictEqual(null)
      expect(keyOfEntity()).toStrictEqual(null)
      expect(keyOfEntity(undefined)).toStrictEqual(null)
    })
  })
}
