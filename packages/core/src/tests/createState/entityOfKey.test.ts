import {describe, expect, it } from 'vitest';
import {createState, entityOfKey} from 'src'
import { rootLayer } from '../helpers'

export const entityOfKeyTest = () => {
  const statex = createState()

  describe('entityOfKey', () => {
    it('should return entity', () => {
      expect(entityOfKey('Layer:root')).toStrictEqual(rootLayer)
    })

    it('should skip parsing', () => {
      expect(entityOfKey(rootLayer)).toStrictEqual(rootLayer)
    })

    it('should work with long key', () => {
      expect(entityOfKey('Layer:Frame:10.11:Test')).toStrictEqual({
        _type: 'Layer',
        _id: 'Frame:10.11:Test'
      })
    })

    it('invalid entityType', () => {
      expect(entityOfKey(10)).toStrictEqual(null)
      expect(entityOfKey()).toStrictEqual(null)
      expect(entityOfKey(undefined)).toStrictEqual(null)
    })
  })
}
