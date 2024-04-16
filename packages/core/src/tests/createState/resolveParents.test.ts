import { createState } from 'src'
import { avatarLayer, headerLayer, rootLayer } from '../helpers'

export const resolveParentsTest = () => {
  const statex = createState()

  describe('resolveParents', () => {
    it('should resolve one parent', () => {
      const root = {
        ...rootLayer,
        field: avatarLayer
      }
      statex.mutate(root)

      expect(statex.resolveParents(avatarLayer)).toStrictEqual([statex.resolve(root)])
    })

    it('should resolve parents', () => {
      const root = {
        ...rootLayer,
        field: avatarLayer
      }

      const header = {
        ...headerLayer,
        field: avatarLayer
      }
      statex.mutate(root)
      statex.mutate(header)

      expect(statex.resolveParents(avatarLayer)).toStrictEqual([statex.resolve(root), statex.resolve(header)])
    })

    it('invalid field', () => {
      expect(statex.resolveParents('')).toStrictEqual([])
      expect(statex.resolveParents(10)).toStrictEqual([])
      expect(statex.resolveParents()).toStrictEqual([])
    })
  })
}
