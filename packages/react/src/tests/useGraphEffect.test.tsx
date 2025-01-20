import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react-hooks/dom'
import { createState } from '@graph-state/core'
import { useGraphEffect } from '../useGraphEffect'
import { act } from '@testing-library/react-hooks'

describe('useGraphEffect', () => {
  it('should call callback with correct values and unmount correctly', () => {
    const initial = {
      _type: 'User',
      _id: '1',
      age: {
        _type: 'Age',
        _id: 1,
        value: 16,
      },
    }

    const nextValue = {
      _type: 'User',
      _id: '1',
      age: {
        _type: 'Age',
        _id: 1,
        value: 18,
      },
    }

    const graphState = createState({
      initialState: initial,
    })

    // @ts-ignore
    graphState.subscribe = vi.fn((_key, cb) => {
      graphState.subscribeCallback = cb
      return () => {
        graphState.unsubscribeCalled = true
      }
    })

    const cb = vi.fn()
    const render = renderHook(() => useGraphEffect(graphState, 'User:1', cb))
    expect(graphState.subscribe).toHaveBeenCalledTimes(1)

    act(() => {
      // @ts-ignore
      graphState.subscribeCallback?.(nextValue, initial)
    })

    expect(cb).toHaveBeenCalledWith(nextValue, initial)

    render.unmount()
    expect(graphState.unsubscribeCalled).toBe(true)
  })

  it('Should call the callback with updated state when the key changes and track the correct data', () => {
    let callCout = 0
    const userOne = 'User:1'
    const userTwo = 'User:2'
    const initial = {
      _type: 'User',
      _id: '1',
      age: 16,
    }

    const graphState = createState({
      initialState: initial,
    })

    const cb = vi.fn()
    const render = renderHook(
      ({ key }) => {
        callCout++
        return useGraphEffect(graphState, key, cb)
      },
      { initialProps: { key: userOne } }
    )
    graphState.mutate(userOne, { age: 18 })
    expect(cb).toHaveBeenCalledWith({ ...initial, age: 18 }, initial)
    render.rerender({ key: userTwo })
    graphState.mutate(userOne, { age: 19 })
    expect(cb).toHaveBeenCalledTimes(1)
    graphState.mutate(userTwo, { age: 21 })
    expect(cb).toHaveBeenCalledWith(
      {
        _type: 'User',
        _id: '2',
        age: 21,
      },
      null
    )
    expect(callCout).toBe(2)
  })

  it('Should work correctly with Object key', () => {
    const initial = {
      _type: 'User',
      _id: '1',
      age: 16,
    }

    const graphState = createState({
      initialState: initial,
    })

    const cb = vi.fn()

    renderHook(() => useGraphEffect(graphState, initial, cb))
    graphState.mutate({ ...initial, age: 18 })
    expect(cb).toHaveBeenCalledWith({ ...initial, age: 18 }, initial)
  })
})
