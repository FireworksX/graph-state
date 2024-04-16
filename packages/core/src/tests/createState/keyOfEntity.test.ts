import { createState } from 'src'
import { rootLayer } from '../helpers'

export const keyOfEntityTest = () => {
  const statex = createState()

  describe('keyOfEntity', () => {
    it('should return key', () => {
      expect(statex.keyOfEntity(rootLayer)).toEqual('Layer:root')
    })

    it('should skip parsing', () => {
      expect(statex.keyOfEntity('Layer:root')).toEqual('Layer:root')
    })

    it('invalid entityType', () => {
      expect(statex.keyOfEntity('Layer')).toStrictEqual(null)
      expect(statex.keyOfEntity(10)).toStrictEqual(null)
      expect(statex.keyOfEntity()).toStrictEqual(null)
      expect(statex.keyOfEntity(undefined)).toStrictEqual(null)
    })
  })
}
