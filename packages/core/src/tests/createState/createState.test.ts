import { describe, it, expect } from 'vitest'
import { createState } from 'src'
import { headerLayer, rootLayer } from '../helpers'

describe('createState', () => {
  it('should create state with initial state', () => {
    const statex = createState({
      initialState: {
        ...rootLayer,
        field: {
          ...headerLayer,
          arg: 10,
        },
      },
    })

    expect(statex.resolve(headerLayer).arg).toBe(10)
  })

  it('should create state with initial state as array', () => {
    const statex = createState({
      initialState: {
        _type: 'test',
        _id: '10',
      },
    })

    console.log(statex.linkRefs)
    console.log(statex.resolve(statex), statex.resolve('test:10'))
    expect(statex.resolve(statex).arg).toBe(10)
  })
})
