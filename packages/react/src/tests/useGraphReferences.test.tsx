// @ts-nocheck
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react-hooks/dom'
import { createState } from '@graph-state/core'
import { useGraphReferences } from '../useGraphReferences'

const createRefsState = () => {
  const variable = {
    _type: 'Variable',
    _id: '0',
    value: 1,
  }
  const initial = {
    version: '1.0',
    ref: 'Variable:0',
  }
  return createState({
    initialState: { initial, variable },
  })
}

describe('useGraphReferences', () => {
  it('should get bounds', () => {
    const graphState = createRefsState()
    const stateKey = graphState.key

    const { result } = renderHook(() => useGraphReferences(graphState, 'Variable:0'))
    expect(result.current).toEqual([`${stateKey}.initial`, stateKey])

    const { result: resultWithPartialKeys } = renderHook(() =>
      useGraphReferences(graphState, 'Variable:0', { withPartialKeys: true })
    )
    expect(resultWithPartialKeys.current).toEqual([stateKey])
  })

  it('should unsubscribe on unmount', () => {
    const graphState = createRefsState()
    const stateKey = graphState.key

    const { result, unmount } = renderHook(() => useGraphReferences(graphState, 'Variable:0'))

    expect(result.current).toEqual([`${stateKey}.initial`, stateKey])
    unmount()

    graphState.mutate(stateKey, { ref: 'Other' })
    expect(result.current).toEqual([`${stateKey}.initial`, stateKey])
  })

  it('should update references on mutation', () => {
    const graphState = createRefsState()
    const stateKey = graphState.key

    const { result } = renderHook(() => useGraphReferences(graphState, 'Variable:0'))

    expect(result.current).toEqual([`${stateKey}.initial`, stateKey])

    graphState.mutate(stateKey, { initial: { version: '2.0' } })
    expect(result.current).toEqual(graphState.getReferences('Variable:0'))
  })

  it('should update when field changes', () => {
    const varA = { _type: 'Variable', _id: 'a', value: 1 }
    const varB = { _type: 'Variable', _id: 'b', value: 2 }
    const initial = {
      version: '1.0',
      refA: 'Variable:a',
      refB: 'Variable:b',
    }
    const graphState = createState({
      initialState: { initial, varA, varB },
    })

    const { result, rerender } = renderHook(({ field }) => useGraphReferences(graphState, field), {
      initialProps: { field: 'Variable:a' },
    })

    expect(result.current).toEqual(graphState.getReferences('Variable:a'))

    rerender({ field: 'Variable:b' })
    expect(result.current).toEqual(graphState.getReferences('Variable:b'))
  })

  it('should update after invalidate', () => {
    const graphState = createRefsState()
    const stateKey = graphState.key

    const { result } = renderHook(() => useGraphReferences(graphState, 'Variable:0'))

    expect(result.current).toEqual([`${stateKey}.initial`, stateKey])

    graphState.invalidate('Variable:0')
    expect(result.current).toEqual(graphState.getReferences('Variable:0'))
  })

  it('should render only once on initial mount', () => {
    const graphState = createRefsState()

    const { result } = renderHook(() => useGraphReferences(graphState, 'Variable:0'))

    expect(result.all).toHaveLength(1)
  })
})
