import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react-hooks/dom'
import { mockAuthor, mockGraphState } from './mock'
import { useGraphFields } from '../useGraphFields'

describe('useGraphFields', () => {
  it('should return fields', () => {
    const graphState = mockGraphState()
    const { result: authorFields } = renderHook(() => useGraphFields(graphState, 'Author'))
    const { result: postFields } = renderHook(() => useGraphFields(graphState, 'Post'))
    expect(authorFields.current).toStrictEqual(['Author:20'])
    expect(postFields.current).toStrictEqual(['Post:0'])
  })

  it('should return fields after invalidate', () => {
    const graphState = mockGraphState()
    const { result: fields } = renderHook(() => useGraphFields(graphState, 'Author'))

    graphState.invalidate('Author:20')
    expect(fields.current).toHaveLength(0)
  })

  it('should return fields after invalidate by Garbage Collector', () => {
    const graphState = mockGraphState()
    const { result: fields } = renderHook(() => useGraphFields(graphState, 'Author'))

    graphState.mutate('Post:0', { author: 'OtherAuthor' })
    expect(fields.current).toHaveLength(0)
  })

  it('should not notify', () => {
    const graphState = mockGraphState()

    const { result: authorFields } = renderHook(() =>
      useGraphFields(graphState, 'Author', {
        updateSelector: (nextValue, prevValue, updatedFields) => {
          expect(prevValue).toEqual(mockAuthor)
          expect(nextValue).toEqual({ ...mockAuthor, age: 20 })
          expect(updatedFields).toEqual(['age'])
          return false
        },
      })
    )

    graphState.mutate('Author:20', { age: 20 })
    expect(authorFields.all).toHaveLength(2)
  })
})
