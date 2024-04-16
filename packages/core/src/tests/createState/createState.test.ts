import { createState } from 'src'
import { headerLayer, rootLayer } from '../helpers'

export const createStateTest = () => {
  describe('createState', () => {
    it('should create state with initial state', () => {
      const statex = createState({
        initialState: {
          ...rootLayer,
          field: {
            ...headerLayer,
            arg: 10
          }
        }
      })

      expect(statex.resolve(headerLayer).arg).toBe(10)
    })
  })
}
