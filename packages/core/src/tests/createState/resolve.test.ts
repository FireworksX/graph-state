import { createState } from 'src'
import { avatarLayer, headerLayer, rootLayer, sizeVariable } from '../helpers'

export const resolveTest = () => {
  const statex = createState()
  statex.mutate({
    ...rootLayer,
    children: [{ ...headerLayer, children: [{ ...avatarLayer, width: sizeVariable, height: sizeVariable }] }]
  })

  const resolvedAvatar = {
    ...avatarLayer,
    width: statex.keyOfEntity(sizeVariable),
    height: statex.keyOfEntity(sizeVariable)
  }

  describe('resolve', () => {
    it('should resolve by entity', () => {
      expect(statex.resolve({ _type: 'Layer', _id: 'avatar' })).toStrictEqual(resolvedAvatar)
      expect(statex.resolve({ _type: 'Variable', _id: 'size' })).toStrictEqual(sizeVariable)
    })

    it('should resolve by key', () => {
      expect(statex.resolve('Layer:avatar')).toStrictEqual(resolvedAvatar)
      expect(statex.resolve('Variable:size')).toStrictEqual(sizeVariable)
    })

    it('should resolve nested layers', () => {
      expect(statex.resolve('Layer:root')).toStrictEqual({
        ...rootLayer,
        children: [statex.keyOfEntity(headerLayer)]
      })
    })

    it('should have unique link', () => {
      const linkOne = statex.resolve('Layer:root')
      const linkTwo = statex.resolve('Layer:root')
      expect(linkOne === linkTwo).not.toBeTruthy()
    })

    it('invalid field', () => {
      expect(statex.resolve('')).toBe(null)
      expect(statex.resolve(10)).toBe(null)
      expect(statex.resolve()).toBe(null)
    })
  })
}
