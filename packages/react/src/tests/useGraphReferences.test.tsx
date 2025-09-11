// @ts-nocheck
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react-hooks/dom'
import { createState } from '@graph-state/core'
import { useGraphReferences } from '../useGraphReferences'

describe('useGraphReferences', () => {
  it('should get bounds', () => {
    const variable = {
      _type: 'Variable',
      _id: '0',
      value: 1,
    }
    const initial = {
      version: '1.0',
      ref: 'Variable:0',
    }
    const graphState = createState({
      initialState: { initial, variable },
    })
    const { result } = renderHook(() => useGraphReferences(graphState, 'Variable:0'))
    expect(result.current).toEqual(['State:0.initial', 'State:0'])

    const { result: resultWithPartialKeys } = renderHook(() =>
      useGraphReferences(graphState, 'Variable:0', { withPartialKeys: true })
    )
    expect(resultWithPartialKeys.current).toEqual(['State:0'])
  })
})
