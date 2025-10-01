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
      const resultObject = result.current[+index] as any
      expect(graphState.resolve(field)).toMatchObject(resultObject)
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

    expect(result.current[0]).toMatchObject({
      _type: 'Root',
      _id: 'id',
      nested: [{ value: 1 }, { value: 2 }],
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

  it('should not handle subscribing to field changes', () => {
    const initial = {
      _type: 'Root',
      _id: 'id',
      fieldOld: { value: 1 },
      fieldNew: { value: 2 },
    }

    const graphState = createState({
      initialState: initial,
    })

    const { result } = renderHook(() =>
      useGraphStack(graphState, ['Root:id.fieldOld', 'Root:id.fieldNew'], {
        selector: graph => ({ value: graph.value }),
      })
    )

    graphState.mutate('Root:id.fieldOld', { value: 20 })
    graphState.mutate('Root:id.fieldNew', { value: 30 })

    expect(result.current[0]).toEqual({ value: 20 })
    expect(result.current[1]).toEqual({ value: 30 })
  })

  it('should return empty stack while paused and catch up after resume', () => {
    const initial = {
      _type: 'Root',
      _id: 'id',
      fieldOld: { value: 1 },
      fieldNew: { value: 2 },
    }

    const graphState = createState({
      initialState: initial,
    })

    const fields = ['Root:id.fieldOld', 'Root:id.fieldNew']
    const { result, rerender } = renderHook(({ pause }) => useGraphStack(graphState, fields, { pause }), {
      initialProps: { pause: true },
    })

    expect(result.current).toEqual([])

    graphState.mutate(fields[0], { value: 10 })
    graphState.mutate(fields[1], { value: 20 })
    expect(result.current).toEqual([])

    rerender({ pause: false })

    expect(result.current).toHaveLength(2)
    fields.forEach((field, index) => {
      expect(result.current[index]).toEqual(graphState.resolve(field))
    })
  })
})
