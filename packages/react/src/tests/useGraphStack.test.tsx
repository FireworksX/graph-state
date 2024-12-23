import { describe, it, expect } from 'vitest'
import { createState } from '@graph-state/core'
import { renderHook } from '@testing-library/react-hooks/dom'
import { useGraphStack } from '../useGraphStack'

describe('useGraphStack', () => {
  it('should resolve stacked values', () => {
    const initial = {
      _type: 'Root',
      _id: 'id',
      fieldOld: { value: 1 },
      fieldNew: { value: 2 },
    }

    const graphState = createState({
      initialState: initial,
    })

    const { result } = renderHook(() => useGraphStack(graphState, ['Root:id.fieldOld', 'Root:id.fieldNew']))

    expect(result?.current).toHaveLength(2)
    ;['Root:id.fieldOld', 'Root:id.fieldNew'].forEach((field, index) => {
      expect(graphState.resolve(field)).toStrictEqual(result.current[+index])
    })
  })

  it('should handle subscribing to field changes', () => {
    const initial = {
      _type: 'Root',
      _id: 'id',
      fieldOld: { value: 1 },
      fieldNew: { value: 2 },
    }

    const graphState = createState({
      initialState: initial,
    })

    const { result, rerender } = renderHook(({ field }) => useGraphStack(graphState, field), {
      initialProps: { field: ['Root:id.fieldOld'] },
    })

    rerender({ field: ['Root:id.fieldNew'] })

    expect(result.current[0]).toEqual(graphState.resolve('Root:id.fieldNew'))
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
    const { result } = renderHook(() => useGraphStack(graphState, ['Root:id']))

    expect(result.current[0]).toStrictEqual({
      _type: 'Root',
      _id: 'id',
      nested: [
        { value: 1, _type: 'Root', _id: 'id.nested.0' },
        { value: 2, _type: 'Root', _id: 'id.nested.1' },
      ],
    })
  })

  it('should return fields after invalidate by Garbage Collector', () => {
    const graphState = createState({
      _type: 'State',
      initialState: {
        authors: [
          {
            _type: 'User',
            _id: 0,
            skill: { _type: 'Skill', _id: 'js' },
          },
        ],
      },
    })
    const { result: fields } = renderHook(() => useGraphStack(graphState, ['Skill:js']))

    graphState.mutate('User:0', { skill: 'OtherFiledValue' })
    expect(fields.current).toHaveLength(0)
  })
})
