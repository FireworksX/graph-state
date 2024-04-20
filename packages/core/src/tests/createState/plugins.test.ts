import { describe, expect, it, vi } from 'vitest'
import { createState } from 'src'
import { Plugin } from 'src/createState'

describe('createState', () => {
  describe('plugins', () => {
    it('should invoke plugin body', () => {
      const pluginBodySpy = vi.fn()

      const plugin: Plugin = statex => {
        pluginBodySpy(statex)

        return statex
      }

      const statex = createState({
        plugins: [plugin],
      })

      expect(pluginBodySpy).toBeCalledTimes(1)
      expect(pluginBodySpy).toBeCalledWith(statex)
    })

    it('should invoke few plugins', () => {
      const firstPluginBodySpy = vi.fn()
      const secondPluginBodySpy = vi.fn()

      const firstPlugin: Plugin = statex => {
        firstPluginBodySpy(statex)
        return statex
      }
      const secondPlugin: Plugin = statex => {
        secondPluginBodySpy(statex)
        return statex
      }

      const statex = createState({
        plugins: [firstPlugin, secondPlugin],
      })

      expect(firstPluginBodySpy).toBeCalledTimes(1)
      expect(firstPluginBodySpy).toBeCalledWith(statex)

      expect(secondPluginBodySpy).toBeCalledTimes(1)
      expect(secondPluginBodySpy).toBeCalledWith(statex)
    })
  })

  it('should mutate Statex state', () => {
    const fn = vi.fn(() => 'test')

    const plugin: Plugin = statex => {
      statex.testMethod = fn
      return statex
    }

    const statex = createState({
      plugins: [plugin],
    })

    expect(statex).toHaveProperty('testMethod')

    statex.testMethod()
    expect(fn).toReturnWith('test')
  })

  it('should mutate Statex state with few plugins', () => {
    const pluginFirstMethod = vi.fn(() => 'first')
    const pluginSecondMethod = vi.fn(() => 'second')

    const firstPlugin: Plugin = statex => {
      statex.firstMethod = pluginFirstMethod
      return statex
    }

    const secondPlugin: Plugin = statex => {
      statex.secondMethod = pluginSecondMethod
      return statex
    }

    const statex = createState({
      plugins: [firstPlugin, secondPlugin],
    })

    expect(statex).toHaveProperty('firstMethod')
    expect(statex).toHaveProperty('secondMethod')

    statex.firstMethod()
    expect(pluginFirstMethod).toReturnWith('first')

    statex.secondMethod()
    expect(pluginSecondMethod).toReturnWith('second')
  })

  it('should call plugin method inside other plugin', () => {
    const pluginFirstMethod = vi.fn(() => 'first')
    const pluginSecondMethod = vi.fn(() => 'second')

    const firstPlugin: Plugin = statex => {
      statex.firstMethod = pluginFirstMethod
      return statex
    }

    const secondPlugin: Plugin = statex => {
      expect(statex).toHaveProperty('firstMethod')

      statex.firstMethod()
      expect(pluginFirstMethod).toReturnWith('first')

      statex.secondMethod = pluginSecondMethod
      return statex
    }

    const statex = createState({
      plugins: [firstPlugin, secondPlugin],
    })

    statex.firstMethod()
    expect(pluginFirstMethod).toReturnWith('first')

    statex.secondMethod()
    expect(pluginSecondMethod).toReturnWith('second')
  })

  it('should not throw if plugin dont return statex', () => {
    const pluginMethod = vi.fn(() => 'first')

    const plugin: Plugin = statex => {
      statex.method = pluginMethod
    }

    const statex = createState({
      plugins: [plugin],
    })

    expect(() => statex.method()).not.toThrow()
    expect(pluginMethod).toReturnWith('first')
    expect(statex).toBeInstanceOf(Object)
  })
})
