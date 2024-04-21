import { describe, expect, it } from 'vitest'
import { createState } from 'src'
import { avatarLayer, headerLayer, rootLayer } from '../helpers'

describe('createState', () => {
  const graphState = createState()

  describe('resolveParents', () => {
    it('should resolve one parent', () => {
      const root = {
        ...rootLayer,
        field: avatarLayer,
      }
      graphState.mutate(root)

      expect(graphState.resolveParents(avatarLayer)).toStrictEqual([graphState.resolve(root)])
    })

    it('should resolve parents', () => {
      const root = {
        ...rootLayer,
        field: avatarLayer,
      }

      const header = {
        ...headerLayer,
        field: avatarLayer,
      }
      graphState.mutate(root)
      graphState.mutate(header)

      expect(graphState.resolveParents(avatarLayer)).toStrictEqual([graphState.resolve(root), statex.resolve(header)])
    })

    it('invalid field', () => {
      expect(statex.resolveParents('')).toStrictEqual([])
      expect(statex.resolveParents(10)).toStrictEqual([])
      expect(statex.resolveParents()).toStrictEqual([])
    })
  })
})
