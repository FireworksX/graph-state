import { describe, expectTypeOf, it } from 'vitest'
import { createState } from '../createState'

interface UserGraph {
  _type: 'User'
  age: number
}

interface PostGraph {
  _type: 'Post'
  text: string
}

describe('createState', () => {
  it('should validate resolve value', () => {
    const state = createState<UserGraph | PostGraph>()

    const post = state.resolve('Post:1')
    const user = state.resolve('User:1')

    expectTypeOf(post).toEqualTypeOf<PostGraph | null>()
    expectTypeOf(user).toEqualTypeOf<UserGraph | null>()
  })
})
