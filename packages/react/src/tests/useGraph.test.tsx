// @ts-nocheck
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react-hooks/dom'
import { mockAuthor, mockGraphState } from './mock'
import { useGraphFields } from '../useGraphFields'
import { useGraph } from '../useGraph'
import { createState } from '@graph-state/core'

describe('useGraph', () => {
  it('should render with invalid args', () => {
    const fullEmpty = renderHook(() => useGraph())
    const numberArgs = renderHook(() => useGraph(10, 2))
    const boolArgs = renderHook(() => useGraph(true, 2))
    const objArgs = renderHook(() => useGraph({ test: 10 }, { value: 1 }))

    ;[fullEmpty, numberArgs, boolArgs, objArgs].forEach(render => {
      expect(render.result.error).toBeUndefined()
    })
  })

  it('should initialize state and update on change', () => {
    const initial = {
      version: '1.0',
    }
    const graphState = createState({
      initialState: initial,
    })
    const { result } = renderHook(() => useGraph(graphState, graphState.key))
    const [state, updateState] = result.current

    expect(state).toMatchObject(initial)
    updateState({ version: '2.1' })
    expect(result.current[0]).toMatchObject({
      version: '2.1',
    })
  })

  it('should return resolved values with deeply nested objects, with deep option', () => {
    const initial = {
      _type: 'Root',
      _id: 'id',
      nested: [{ value: 1 }, { value: 2 }],
    }
    const graphState = createState({
      initialState: initial,
    })
    const { result } = renderHook(() => useGraph(graphState, 'Root:id', { deep: true }))

    const [state] = result.current

    expect(state).toStrictEqual({
      _type: 'Root',
      _id: 'id',
      nested: [
        { value: 1, _type: 'Root', _id: 'id.nested.0' },
        { value: 2, _type: 'Root', _id: 'id.nested.1' },
      ],
    })
  })

  it('should initialize graph state and update on change', () => {
    const graphState = mockGraphState()
    const { result: authorEntity } = renderHook(() => useGraphFields(graphState, 'Author'))
    const { result } = renderHook(() => useGraph(graphState, authorEntity.current[0]))
    const [author, updateAuthor] = result.current

    expect(author).toEqual(graphState.resolve(authorEntity.current[0]))
    updateAuthor({ name: 'Elizabeth J. McKeon' })
    expect(result.current[0]).toStrictEqual({
      _type: 'Author',
      _id: '20',
      name: 'Elizabeth J. McKeon',
      key: '100',
    })
  })

  it('should resolve value if pass field as Graph', () => {
    const graphState = mockGraphState()
    const postGraph = { _type: 'Post', _id: '0' }
    const { result } = renderHook(() => useGraph(graphState, postGraph))
    const [post, updatePost] = result.current

    expect(post).toEqual(graphState.resolve(postGraph))
    updatePost({ name: 'post test' })
    expect(result.current[0]).toMatchObject({
      name: 'post test',
    })
  })

  it('should handle subscribing to field changes', () => {
    const authorKey = 'Author:20'
    const postKey = 'Post:0'
    const graphState = mockGraphState()

    const { result, rerender } = renderHook(({ field }) => useGraph(graphState, field), {
      initialProps: { field: authorKey },
    })

    rerender({ field: postKey })
    expect(result.current[0]).toEqual(graphState.resolve(postKey))
  })

  it("should unsubscribe when there's an unmount", () => {
    const authorKey = 'Author:20'
    const graphState = mockGraphState()
    const { result, unmount } = renderHook(() => useGraph(graphState, authorKey))

    expect(result.current[0]).toEqual(graphState.resolve(authorKey))
    unmount()
    result.current[1]({ name: 'Donald M. Timm' })
    expect(result.current[0]).toStrictEqual({ _type: 'Author', _id: '20', name: 'John Doe', key: '100' })
  })

  it('should notify after invalidating and recreating', () => {
    const authorKey = 'Author:20'
    const graphState = createState()
    graphState.mutate(mockAuthor)
    const { result } = renderHook(() => useGraph(graphState, authorKey))

    expect(result.current[0]).toEqual(graphState.resolve(authorKey))
    graphState.invalidate(authorKey)
    expect(result.current[0]).toEqual(null)
    result.current[1](mockAuthor)
    expect(result.current[0]).toEqual(graphState.resolve(authorKey))
  })
})
