import { vi } from 'vitest'
import { createState } from 'src'
import { avatarLayer, rootLayer } from '../helpers'

export const invalidateTest = () => {
  describe('invalidate', () => {
    it('should invalidate layer', () => {
      const statex = createState({
        initialState: {
          ...rootLayer,
          children: [avatarLayer],
          field: avatarLayer
        }
      })

      statex.invalidate(avatarLayer)

      expect(statex.inspectFields('Layer')).not.toHaveProperty('Layer:avatar')
      expect(statex.resolve(avatarLayer)).toBe(null)
      expect(statex.resolve(rootLayer).children).toStrictEqual([])
      expect(statex.resolve(rootLayer).field).toStrictEqual(null)
    })

    it('should notify after invalidate', () => {
      const spy = vi.fn()
      const statex = createState()
      statex.mutate({
        ...rootLayer,
        children: [avatarLayer]
      })

      statex.subscribe(avatarLayer, spy)
      statex.invalidate(avatarLayer)

      expect(spy).toBeCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(null)
    })

    it('should skip notify after invalidate', () => {
      const spy = vi.fn()
      const statex = createState()
      statex.mutate({
        ...rootLayer,
        children: [avatarLayer]
      })

      statex.invalidate(avatarLayer)
      statex.subscribe(rootLayer, spy)

      statex.mutate({
        ...avatarLayer,
        field: 'test'
      })

      expect(spy).toBeCalledTimes(0)
    })
  })
}
