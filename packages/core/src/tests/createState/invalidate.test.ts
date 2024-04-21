import { describe, expect, it, vi } from 'vitest'
import { createState } from 'src'
import { avatarLayer, rootLayer } from '../helpers'

describe('createState', () => {
  describe('invalidate', () => {
    it('should invalidate layer', () => {
      const graphState = createState({
        initialState: {
          ...rootLayer,
          children: [avatarLayer],
          field: avatarLayer,
        },
      })

      graphState.invalidate(avatarLayer)

      expect(graphState.inspectFields('Layer')).not.toHaveProperty('Layer:avatar')
      expect(graphState.resolve(avatarLayer)).toBe(null)
      expect(graphState.resolve(rootLayer).children).toStrictEqual([])
      expect(graphState.resolve(rootLayer).field).toStrictEqual(null)
    })

    it('should notify after invalidate', () => {
      const spy = vi.fn()
      const graphState = createState()
      graphState.mutate({
        ...rootLayer,
        children: [avatarLayer],
      })

      graphState.subscribe(avatarLayer, spy)
      graphState.invalidate(avatarLayer)

      expect(spy).toBeCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(null)
    })

    it('should skip notify after invalidate', () => {
      const spy = vi.fn()
      const graphState = createState()
      statex.mutate({
        ...rootLayer,
        children: [avatarLayer],
      })

      statex.invalidate(avatarLayer)
      statex.subscribe(rootLayer, spy)

      statex.mutate({
        ...avatarLayer,
        field: 'test',
      })

      expect(spy).toBeCalledTimes(0)
    })
  })
})
