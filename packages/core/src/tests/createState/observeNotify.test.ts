import { describe, expect, it, vi } from 'vitest'
import { createState, keyOfEntity } from 'src'
import { avatarLayer, headerLayer, rootLayer, sizeVariable } from '../helpers'

describe('createState', () => {
  describe('observe/notify', () => {
    it('should notify if set new value into Layer', () => {
      const graphState = createState()
      graphState.mutate(rootLayer)
      const spy = vi.fn()

      graphState.subscribe(rootLayer, spy)
      graphState.mutate({
        _type: 'Layer',
        _id: 'root',
        opacity: 0,
      })

      expect(spy).toBeCalledTimes(1)
    })

    it('should notify children when parent was changed', () => {
      const graphState = createState()

      const root = {
        ...rootLayer,
        children: [headerLayer],
      }
      graphState.mutate(root)
      const spy = vi.fn()

      graphState.subscribe(headerLayer, spy)
      graphState.mutate({
        ...rootLayer,
        overflow: 'x-hidden',
      })

      expect(spy).toBeCalledTimes(1)
    })

    test.skip('should notify if pass key as string', () => {
      const graphState = createState()
      const root = {
        ...rootLayer,
        children: [keyOfEntity(headerLayer)],
      }
      graphState.mutate(root)

      const spy = vi.fn()

      graphState.subscribe(headerLayer, spy)
      graphState.mutate({
        ...rootLayer,
        overflow: 'x-hidden',
      })

      expect(spy).toBeCalledTimes(1)
    })

    it('should skip notify parent if child was changed', () => {
      const opacity = { _type: 'Variable', _id: 'opacity', value: 0 }
      const root = {
        ...rootLayer,
        opacity,
      }
      const graphState = createState({ initialState: root })
      const spy = vi.fn()

      graphState.subscribe(rootLayer, spy)
      graphState.mutate({
        ...opacity,
        value: 1,
      })

      expect(spy).toBeCalledTimes(0)
    })

    it('should skip nested tree notify', () => {
      const header = { ...headerLayer, children: [avatarLayer] }
      const root = { ...rootLayer, children: [header] }
      const graphState = createState({ initialState: root })

      const headerSpy = vi.fn()
      const rootSpy = vi.fn()

      graphState.subscribe(headerLayer, headerSpy)
      graphState.subscribe(rootLayer, rootSpy)
      graphState.mutate({
        ...avatarLayer,
        visible: false,
      })

      expect(headerSpy).toBeCalledTimes(0)
      expect(rootSpy).toBeCalledTimes(0)
    })

    it('should notify nested tree', () => {
      const header = { ...headerLayer, children: [avatarLayer] }
      const root = { ...rootLayer, children: [header] }
      const graphState = createState({ initialState: root })

      const headerSpy = vi.fn()
      const avatarSpy = vi.fn()

      graphState.subscribe(headerLayer, headerSpy)
      statex.subscribe(avatarLayer, avatarSpy)
      statex.mutate({
        ...rootLayer,
        visible: false,
      })

      expect(headerSpy).toBeCalledTimes(1)
      expect(avatarSpy).toBeCalledTimes(1)
    })

    it('should subscribe before create entity', () => {
      const header = { ...headerLayer, children: [avatarLayer] }
      const statex = createState({ initialState: header })

      const headerSpy = vi.fn()

      statex.subscribe(avatarLayer, headerSpy)
      statex.mutate({
        ...headerLayer,
        field: 'test',
      })

      expect(headerSpy).toBeCalledTimes(1)
    })

    it('should unsubscribe', () => {
      const statex = createState()
      statex.mutate(rootLayer)
      const spy = vi.fn()
      const spy2 = vi.fn()

      statex.subscribe(rootLayer, spy)
      const unsubscribe = statex.subscribe(rootLayer, spy2)
      unsubscribe()

      statex.mutate({
        ...rootLayer,
        children: ['test'],
      })

      expect(spy).toBeCalledTimes(1)
      expect(spy2).toBeCalledTimes(0)
    })

    it('should return resolved newState', () => {
      const statex = createState()
      const header = { ...headerLayer, display: 'block' }
      statex.mutate(header)
      const spy = vi.fn()

      statex.subscribe(header, spy)
      statex.mutate({
        ...header,
        display: 'none',
      })

      expect(spy).toBeCalledTimes(1)
      expect(spy).toHaveBeenCalledWith({
        ...header,
        display: 'none',
      })
    })

    it('should not return deep resolved data', () => {
      const statex = createState()
      const header = { ...headerLayer, display: 'block', ref: rootLayer }
      statex.mutate(header)
      const spy = vi.fn()

      statex.subscribe(header, spy)
      statex.mutate({
        ...header,
        display: 'none',
      })

      expect(spy).toHaveBeenCalledWith({
        ...header,
        display: 'none',
        ref: keyOfEntity(rootLayer),
      })
    })

    it('should notify self store', () => {
      const statex = createState()
      const spy = vi.fn()

      statex.subscribe(statex, spy)
      statex.mutate(rootLayer)

      expect(spy).toBeCalledTimes(1)
    })

    test.skip('should notify self store with each state', () => {
      const statex = createState()
      const spy = vi.fn()

      let updateIndex = 0

      statex.subscribe(statex, data => {
        updateIndex++
        spy()

        switch (updateIndex) {
          case 1:
            return expect(data).toStrictEqual(sizeVariable)
          case 2:
            return expect(data).toStrictEqual(sizeVariable)
          case 3:
            return expect(data).toStrictEqual(avatarLayer)
          case 4:
            return expect(data).toStrictEqual(avatarLayer)
          case 5:
            return expect(data).toStrictEqual(rootLayer)
        }
      })
      statex.mutate(rootLayer)

      expect(spy).toBeCalledTimes(9)
    })
  })
})
