import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react-hooks/dom'
import { mockGraphState } from './mock'
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

  it('should unsubscribe on unmount', () => {
    const graphState = mockGraphState()
    const { result, unmount } = renderHook(() => useGraphFields(graphState, 'Author'))

    expect(result.current).toStrictEqual(['Author:20'])
    unmount()

    graphState.invalidate('Author:20')
    expect(result.current).toStrictEqual(['Author:20'])
  })

  it('should update when type changes', () => {
    const graphState = mockGraphState()
    const { result, rerender } = renderHook(({ type }) => useGraphFields(graphState, type), {
      initialProps: { type: 'Author' },
    })

    expect(result.current).toStrictEqual(['Author:20'])

    rerender({ type: 'Post' })
    expect(result.current).toStrictEqual(['Post:0'])
  })

  it('should render only once on initial mount', () => {
    const graphState = mockGraphState()
    const { result } = renderHook(() => useGraphFields(graphState, 'Author'))

    expect(result.all).toHaveLength(1)
    expect(result.current).toStrictEqual(['Author:20'])
  })

  it('should not notify', () => {
    const graphState = mockGraphState()

    const { result } = renderHook(() =>
      useGraphFields(graphState, 'Author', {
        selector: graph => {
          return { name: graph.name }
        },
      })
    )

    graphState.mutate('Author:20', { age: 20 })
    expect(result.all).toHaveLength(1)
  })
})
