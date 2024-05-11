import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react-hooks/dom'
import { mockGraphState } from './mock'
import { useGraphFields } from '../useGraphFields'

describe('useInspectFields', () => {
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
})
