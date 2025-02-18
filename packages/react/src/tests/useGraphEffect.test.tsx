// @ts-nocheck
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react-hooks/dom'
import { createState } from '@graph-state/core'
import { useGraphEffect } from '../useGraphEffect'
import { mockAuthor } from './mock'

describe('useGraphEffect', () => {
  it('should render with invalid args', () => {
    const fullEmpty = renderHook(() => useGraphEffect())
    const numberArgs = renderHook(() => useGraphEffect(10, 2))
    const boolArgs = renderHook(() => useGraphEffect(true, 2))
    const objArgs = renderHook(() => useGraphEffect({ test: 10 }, { value: 1 }))

    ;[fullEmpty, numberArgs, boolArgs, objArgs].forEach(render => {
      expect(render.result.error).toBeUndefined()
    })
  })

  it('should call callback with correct values and unmount correctly', () => {
    let renderCount = 0
    const initial = {
      _type: 'User',
      _id: '1',
      age: 16,
    }

    const nextValue = {
      _type: 'User',
      _id: '1',
      age: 18,
    }

    const graphState = createState({
      initialState: initial,
    })

    const cb = vi.fn()
    const render = renderHook(() => {
      renderCount++
      return useGraphEffect(graphState, 'User:1', cb)
    })

    graphState.mutate('User:1', nextValue)
    expect(cb).toHaveBeenCalledWith(nextValue, initial, undefined)
    render.unmount()
    graphState.mutate('User:1', initial)
    expect(renderCount).toEqual(1)
  })

  it('Should call the callback with updated state when the key changes and track the correct data', () => {
    let callCount = 0
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
        callCount++
        return useGraphEffect(graphState, key, cb)
      },
      { initialProps: { key: userOne } }
    )
    graphState.mutate(userOne, { age: 18 })
    expect(cb).toHaveBeenCalledWith({ ...initial, age: 18 }, initial, undefined)
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
      null,
      undefined
    )
    expect(callCount).toBe(2)
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
    expect(cb).toHaveBeenCalledWith({ ...initial, age: 18 }, initial, undefined)
  })

  it('Should work correctly with array', () => {
    let renderCount = 0
    const userOne = {
      _type: 'User',
      _id: '1',
      age: 16,
    }
    const userTwo = {
      _type: 'User',
      _id: '2',
      age: 14,
    }
    const userThree = {
      _type: 'User',
      _id: '3',
      age: 25,
    }

    const initial = {
      _type: 'Product',
      _id: '1',
      users: [userOne, userTwo, userThree],
    }

    const graphState = createState({
      initialState: initial,
    })
    const cb = vi.fn()

    const render = renderHook(() => {
      renderCount++
      return useGraphEffect(graphState, [userOne, userTwo, userThree], cb)
    })
    ;[
      { id: 1, age: 14 },
      { id: 2, age: 25 },
      { id: 3, age: 36 },
    ].forEach(({ id, age }) => {
      graphState.mutate(`User:${id}`, { age })
    })

    expect(cb).toHaveBeenCalledTimes(3)
    ;[
      [userOne, { ...userOne, age: 14 }],
      [userTwo, { ...userTwo, age: 25 }],
      [userThree, { ...userThree, age: 36 }],
    ].forEach(([prev, next], index) => {
      expect(cb).toHaveBeenCalledWith(next, prev, index)
    })

    render.unmount()
    graphState.mutate('User:1', { age: 67 })
    expect(renderCount).toEqual(1)
  })

  it('should not execute callback', () => {
    let renderCount = 0
    const authorKey = 'Author:20'
    const graphState = createState()
    graphState.mutate(mockAuthor)
    const cb = vi.fn()

    renderHook(() => {
      renderCount++
      useGraphEffect(graphState, authorKey, cb, {
        selector: graph => ({ name: graph.name }),
      })
    })
    graphState.mutate(authorKey, { age: 20 })
    expect(cb).toBeCalledTimes(0)
    expect(renderCount).toEqual(1)
  })
})
