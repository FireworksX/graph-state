import { createState } from 'src'
import { rootLayer } from '../helpers'

export const entityOfKeyTest = () => {
  const statex = createState()

  describe('entityOfKey', () => {
    it('should return entity', () => {
      expect(statex.entityOfKey('Layer:root')).toStrictEqual(rootLayer)
    })

    it('should skip parsing', () => {
      expect(statex.entityOfKey(rootLayer)).toStrictEqual(rootLayer)
    })

    it('should work with long key', () => {
      expect(statex.entityOfKey('Layer:Frame:10.11:Test')).toStrictEqual({
        _type: 'Layer',
        _id: 'Frame:10.11:Test'
      })
    })

    it('invalid entityType', () => {
      expect(statex.entityOfKey(10)).toStrictEqual(null)
      expect(statex.entityOfKey()).toStrictEqual(null)
      expect(statex.entityOfKey(undefined)).toStrictEqual(null)
    })
  })
}
