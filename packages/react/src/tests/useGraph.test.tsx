import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react-hooks'
import { mockGraphState } from './mock'
import { useGraphFields } from '../useGraphFields'
import { useGraph } from '../useGraph'

describe('useGraph', () => {
  it('should initialize state and update on change', () => {
    const graphState = mockGraphState()
    const { result: authorEntity } = renderHook(() => useGraphFields(graphState, 'Author'))
    const { result } = renderHook(() => useGraph(graphState, authorEntity.current[0]))
    const [author, updateAuthor] = result.current

    expect(author).toEqual(graphState.resolve(authorEntity.current[0]))

    updateAuthor({ name: 'Elizabeth J. McKeon' })

    expect(result.current[0]).toStrictEqual({
      _type: 'Author',
      _id: '100',
      name: 'Elizabeth J. McKeon',
      key: '100',
    })
  })

  it('should handle subscribing to field changes', () => {
    const authorKey = 'Author:100'
    const postKey = 'Post:0'
    const graphState = mockGraphState()

    const { result, rerender } = renderHook(({ field }) => useGraph(graphState, field), {
      initialProps: { field: authorKey },
    })

    rerender({ field: postKey })

    expect(result.current[0]).toEqual(graphState.resolve(postKey))
  })

  it("should unsubscribe when there's an unmount", () => {
    const authorKey = 'Author:100'
    const graphState = mockGraphState()

    const { result, unmount } = renderHook(() => useGraph(graphState, authorKey))

    expect(result.current[0]).toEqual(graphState.resolve(authorKey))

    unmount()

    result.current[1]({ name: 'Donald M. Timm' })

    expect(result.current[0]).toStrictEqual({ _type: 'Author', _id: '100', name: 'John Doe', key: '100' })
  })
})
