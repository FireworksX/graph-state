import { describe, it, expect, vi } from 'vitest'
import { createState } from '../index'
import { avatarLayer, headerLayer, rootLayer, sizeVariable } from './helpers'
import type { Plugin } from '../index'
import { isHtmlContent, isHtmlNode } from '@graph-state/checkers'

describe('createState', () => {
  it('should create state with initial state', () => {
    const graphState = createState({
      _type: 'Test',
      _id: 10,
      initialState: {
        ...rootLayer,
        field: {
          ...headerLayer,
          arg: 10,
        },
      },
    })

    expect(graphState.resolve(headerLayer).arg).toBe(10)
    expect(graphState.key).toBe('Test:10')
  })

  describe('keys', () => {
    describe('keyOfEntity', () => {
      it('should use keying map firstly', () => {
        const graphState = createState({
          keys: {
            User: data => data.uniqId,
          },
        })

        expect(
          graphState.keyOfEntity({
            _type: 'User',
            uniqId: 'totalFirst',
            id: 'firstId',
            _id: 'secondId',
          })
        ).toBe('User:totalFirst')
      })

      it('should use id if exists', () => {
        const graphState = createState()

        expect(
          graphState.keyOfEntity({
            _type: 'User',
            id: 'firstId',
            _id: 'secondId',
          })
        ).toBe('User:firstId')

        expect(
          graphState.keyOfEntity({
            _type: 'User',
            id: 'firstId',
            field: 'prop',
          })
        ).toBe('User:firstId')
      })

      it('should use _id if  and dont exists id', () => {
        const graphState = createState()

        const entity = {
          _type: 'User',
          _id: 'correctId',
        }

        expect(graphState.keyOfEntity(entity)).toEqual('User:correctId')
      })

      it('should return key', () => {
        const graphState = createState()
        expect(graphState.keyOfEntity(rootLayer)).toEqual('Layer:root')
        expect(graphState.keyOfEntity({ _type: 'Test', _id: 0 })).toEqual('Test:0')
      })

      it('should skip parsing', () => {
        const graphState = createState()
        expect(graphState.keyOfEntity('Layer:root')).toEqual('Layer:root')
      })

      it('invalid entityType', () => {
        const graphState = createState()
        expect(graphState.keyOfEntity('Layer')).toStrictEqual(null)
        expect(graphState.keyOfEntity(10)).toStrictEqual(null)
        expect(graphState.keyOfEntity()).toStrictEqual(null)
        expect(graphState.keyOfEntity(undefined)).toStrictEqual(null)
      })
    })

    describe('entityOfKey', () => {
      const graphState = createState()

      it('should return entity', () => {
        expect(graphState.entityOfKey('Layer:root')).toStrictEqual(rootLayer)
      })

      it('should skip parsing', () => {
        expect(graphState.entityOfKey(rootLayer)).toStrictEqual(rootLayer)
      })

      it('should work with long key', () => {
        expect(graphState.entityOfKey('Layer:Frame:10.11:Test')).toStrictEqual({
          _type: 'Layer',
          _id: 'Frame:10.11:Test',
        })
      })

      it('invalid entityType', () => {
        expect(graphState.entityOfKey(10)).toStrictEqual(null)
        expect(graphState.entityOfKey()).toStrictEqual(null)
        expect(graphState.entityOfKey(undefined)).toStrictEqual(null)
      })
    })

    describe('keying', () => {
      it('should call keying function', () => {
        const userFn = vi.fn()
        const entity = {
          _type: 'User',
          field: 'prop',
        }

        const graphState = createState({
          keys: {
            User: userFn,
          },
        })

        graphState.mutate(entity)

        expect(userFn).toHaveBeenCalled()
        expect(userFn).toHaveBeenCalledWith(entity)
        expect(userFn).toHaveBeenCalledTimes(1)
      })

      it('should build key', () => {
        const graphState = createState({
          keys: {
            User: () => 'me',
            Post: post => post.uniq,
            Any: () => null,
          },
        })

        expect(
          graphState.keyOfEntity({
            _type: 'User',
            _id: 'userId',
          })
        ).toBe('User:me')

        expect(
          graphState.keyOfEntity({
            _type: 'Any',
            _id: 'anyId',
            anyProperty: 10,
          })
        ).toBe(null)

        expect(
          graphState.keyOfEntity({
            _type: 'Post',
            uniq: 10,
          })
        ).toBe('Post:10')
      })
    })
  })

  describe('inspectFields', () => {
    const graphState = createState()
    const entities = [rootLayer, headerLayer, avatarLayer, sizeVariable]
    entities.forEach(el => graphState.mutate(el))

    it('should return all layers', () => {
      expect(graphState.inspectFields('Layer')).toStrictEqual(
        [rootLayer, headerLayer, avatarLayer].map(graphState.keyOfEntity)
      )
    })

    it('should return all variables', () => {
      expect(graphState.inspectFields('Variable')).toStrictEqual([sizeVariable].map(graphState.keyOfEntity))
    })

    it('should return new link', () => {
      const one = graphState.inspectFields('Variable')
      const two = graphState.inspectFields('Variable')
      expect(one === two).not.toBeTruthy()
    })

    it('invalid entityType', () => {
      expect(graphState.inspectFields(10)).toStrictEqual([])
      expect(graphState.inspectFields()).toStrictEqual([])
    })

    it('should skip partial keys', () => {
      graphState.mutate({
        _type: 'User',
        _id: 'id',
        nested: {
          value: 100,
        },
      })

      expect(graphState.inspectFields('User')).toStrictEqual(['User:id'])
    })
  })

  describe('invalidate', () => {
    it('should invalidate layer', () => {
      const graphState = createState({
        initialState: {
          ...rootLayer,
          children: [avatarLayer],
          field: avatarLayer,
        },
      })

      graphState.invalidate(avatarLayer)

      expect(graphState.inspectFields('Layer')).not.toHaveProperty('Layer:avatar')
      expect(graphState.resolve(avatarLayer, { safe: false })).toBe(null)
      expect(graphState.resolve(rootLayer).children).toStrictEqual([])
      expect(graphState.resolve(rootLayer).field).toStrictEqual(null)
    })

    it('should notify only parents after invalidate and State', () => {
      const stateSpy = vi.fn()
      const rootSpy = vi.fn()
      const postSpy = vi.fn()
      const siblingSpy = vi.fn()
      const listSpy = vi.fn()
      const graphState = createState({
        initialState: {
          ...rootLayer,
          list: {
            _type: 'List',
            _id: 1,
            values: [avatarLayer],
            sibling: { _type: 'Sibling', _id: 1, nested: { _type: 'Sibling', _id: 2 } },
          },
          post: {
            _type: 'Post',
            _id: 123,
          },
        },
      })

      graphState.subscribe(stateSpy)
      graphState.subscribe(rootLayer, rootSpy)
      graphState.subscribe('List:1', listSpy)
      graphState.subscribe('Post:123', postSpy)
      graphState.subscribe('Sibling:1', siblingSpy)
      graphState.subscribe('Sibling:2', siblingSpy)
      graphState.invalidate(avatarLayer)

      expect(graphState.inspectFields('Layer')).toHaveLength(1)

      /*
       Должен оповеститься только родитель,
       вышестоящие родители должны игнорироваться
       */
      expect(rootSpy).toBeCalledTimes(0)
      /**
       * Post:123 - не должен оповеститься, т.к. у него не общий
       * родитель с удаляемым графом
       */
      expect(postSpy).toBeCalledTimes(0)
      /**
       * State - оповещяется 3 раза. Он реагирует на каждый notify.
       * 1- List:1 оповестился после удаления
       * 2- Sibling:1 оповестился т.к. потомок одного родителя.
       * 3- Sibling:2 оповестился т.к. потомок потомка одного родителя.
       */
      expect(stateSpy).toBeCalledTimes(3)

      /**
       * Оповещается т.к. один родилеь.
       */
      expect(siblingSpy).toBeCalledTimes(2)

      /**
       * Сам родитель
       */
      expect(listSpy).toBeCalledTimes(1)
    })

    it('should notify after invalidate', () => {
      const spy = vi.fn()
      const graphState = createState()
      graphState.mutate({
        ...rootLayer,
        children: [avatarLayer],
      })

      graphState.subscribe(avatarLayer, spy)
      graphState.invalidate(avatarLayer)

      expect(spy).toBeCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(null, expect.objectContaining(avatarLayer))
    })

    it('should notify after invalidating and recreating', () => {
      const spy = vi.fn()
      const graphState = createState()
      graphState.mutate({
        ...rootLayer,
        children: [avatarLayer],
      })

      graphState.subscribe(rootLayer, spy)
      graphState.invalidate(rootLayer)

      expect(spy).toHaveBeenCalledWith(null, expect.objectContaining(rootLayer))

      graphState.mutate({
        ...rootLayer,
        children: [avatarLayer],
      })

      expect(spy).toBeCalledTimes(2)
    })

    it('should skip notify after invalidate', () => {
      const spy = vi.fn()
      const graphState = createState()
      graphState.mutate({
        ...rootLayer,
        children: [avatarLayer],
      })

      graphState.invalidate(avatarLayer)
      graphState.subscribe(rootLayer, spy)

      graphState.mutate({
        ...avatarLayer,
        field: 'test',
      })

      expect(spy).toBeCalledTimes(0)
    })

    it('should notify after invalidate by Garbage Collector', () => {
      const spy = vi.fn()
      const graphState = createState({
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

      graphState.subscribe('Skill:js', spy)
      graphState.mutate('User:0', { skill: 'otherValue' })

      expect(spy).toBeCalledTimes(1)
      expect(spy).toBeCalledWith(null, expect.objectContaining({ _type: 'Skill', _id: 'js' }))
    })
  })

  describe('skips', () => {
    it('should skip value', () => {
      class Test {
        greet() {}
      }
      const htmlContent = '<p style="accent-color: #cccccc">content</p>'

      const state = createState({
        initialState: {
          value: global.document.createElement('div'),
          classValue: new Test(),
          htmlContent,
        },
        skip: [isHtmlNode, isHtmlContent, v => v instanceof Test],
      })

      expect(isHtmlNode(state.resolve(state)?.value)).toBeTruthy()
      expect(state.resolve(state)?.classValue instanceof Test).toBeTruthy()
      expect(state.resolve(state)?.htmlContent).toBe(htmlContent)
    })

    it('should keep value while skipping', () => {
      const state = createState({
        initialState: {
          fileLink: '$$File:100',
          assets: ['$$File:200', '$$File:300'],
        },
        skip: [graph => typeof graph === 'string' && graph.startsWith('$$')],
      })

      expect(state.resolve(state.key).fileLink).toBe('$$File:100')
      expect(state.resolve(state.key).assets).toStrictEqual(['$$File:200', '$$File:300'])

      state.mutate('User:123', {
        avatar: '$$File:1',
      })

      expect(state.resolve('User:123').avatar).toBe('$$File:1')
    })

    /**
     * Когда удаляется ребёнок, обновляется родитель,
     * важно чтобы при обновлении срабатывали skips.
     */
    it('should skip value after invalidate', () => {
      class Test {
        greet() {}
      }

      const state = createState({
        initialState: {
          classValue: new Test(),
          child: { _type: 'Child', _id: 10 },
        },
        skip: [v => v instanceof Test],
      })

      state.invalidate('Child:10')
      expect(state.resolve(state)?.classValue instanceof Test).toBeTruthy()
    })

    it('should skip notify skip fields', () => {
      const state = createState({
        initialState: {},
        skip: [v => typeof v === 'string' && v.startsWith('$$')],
      })

      const subscribeSpy = vi.fn()
      state.subscribe('$$User:1', subscribeSpy)
      state.subscribe('$$User:2', subscribeSpy)
      state.subscribe('$$Field:1', subscribeSpy)

      state.mutate({
        user: {
          parents: ['$$User:1', '$$User:2'],
          test: '$$Field:1',
        },
      })

      expect(subscribeSpy).toBeCalledTimes(0)
    })

    it('should always skip GraphState', () => {
      const subState = createState({
        initialState: {
          version: 1,
        },
      })

      const state = createState({
        initialState: {
          subState,
        },
      })

      expect(state.resolve(state.key).subState.resolve(subState.key).version).toBe(1)
    })
  })

  describe('mutate', () => {
    it('should mutate self State', () => {
      const graphState = createState()
      graphState.mutate({
        overflow: 'hidden',
      })

      expect(graphState.resolve(graphState).overflow).toBe('hidden')

      graphState.mutate({
        overflow: 'auto',
      })

      expect(graphState.resolve(graphState).overflow).toBe('auto')
    })

    it('should mutate with string key', () => {
      const graphState = createState()
      graphState.mutate('Layer:header', {
        overflow: 'hidden',
      })

      expect(graphState.resolve(headerLayer).overflow).toBe('hidden')

      graphState.mutate('Layer:header', {
        overflow: 'auto',
      })

      expect(graphState.resolve(headerLayer).overflow).toBe('auto')
    })

    it('should mutate with function setter', () => {
      const graphState = createState()
      const avatarKey = graphState.keyOfEntity(avatarLayer)
      graphState.mutate('Layer:header', {
        overflow: 'hidden',
        image: avatarLayer,
      })

      expect(graphState.resolve(headerLayer).overflow).toBe('hidden')
      expect(graphState.resolve(headerLayer).image).toStrictEqual(avatarKey)

      graphState.mutate('Layer:header', prev => {
        expect(prev).toStrictEqual({ ...headerLayer, overflow: 'hidden', image: avatarKey })

        return {
          overflow: `${prev.overflow}+auto`,
        }
      })

      expect(graphState.resolve(headerLayer).overflow).toBe('hidden+auto')
    })

    it('should mutate layer property', () => {
      const graphState = createState()
      graphState.mutate({
        ...headerLayer,
        overflow: 'hidden',
      })

      expect(graphState.resolve(headerLayer).overflow).toBe('hidden')

      graphState.mutate({
        ...headerLayer,
        overflow: 'auto',
      })

      expect(graphState.resolve(headerLayer).overflow).toBe('auto')
    })

    it('should add new layer property', () => {
      const graphState = createState()
      graphState.mutate({
        ...headerLayer,
        opacity: 0.7,
      })

      expect(Object.keys(graphState.resolve(headerLayer))).toStrictEqual(['_type', '_id', 'opacity'])
      expect(graphState.resolve(headerLayer).opacity).toBe(0.7)

      graphState.mutate({
        ...headerLayer,
        opacity: 1,
        overflow: 'auto',
      })

      expect(Object.keys(graphState.resolve(headerLayer))).toStrictEqual(['_type', '_id', 'opacity', 'overflow'])
      expect(graphState.resolve(headerLayer).opacity).toBe(1)
      expect(graphState.resolve(headerLayer).overflow).toBe('auto')
    })

    it('should append new item in array', () => {
      const graphState = createState()
      graphState.mutate({
        ...headerLayer,
        children: [],
      })

      graphState.mutate({
        ...headerLayer,
        children: [avatarLayer],
      })

      expect(graphState.resolve(headerLayer).children).toHaveLength(1)
      expect(graphState.resolve(headerLayer).children).toStrictEqual([graphState.keyOfEntity(avatarLayer)])

      graphState.mutate({
        ...headerLayer,
        children: [rootLayer],
      })

      expect(graphState.resolve(headerLayer).children).toHaveLength(2)
      expect(graphState.resolve(headerLayer).children).toStrictEqual([
        graphState.keyOfEntity(avatarLayer),
        graphState.keyOfEntity(rootLayer),
      ])
    })

    describe('array merge', () => {
      it('should skip duplicate links in array by default', () => {
        const graphState = createState()
        graphState.mutate({
          ...headerLayer,
          children: [],
        })

        graphState.mutate({
          ...headerLayer,
          children: [avatarLayer, avatarLayer, 'hello', 'hello'],
        })

        expect(graphState.resolve(headerLayer).children).toHaveLength(3)

        graphState.mutate({
          ...headerLayer,
          children: [avatarLayer, 'hello'],
        })

        expect(graphState.resolve(headerLayer).children).toHaveLength(4)
      })

      it('should allow duplicate links with options', () => {
        const graphState = createState()
        graphState.mutate({
          ...headerLayer,
          children: [],
        })

        graphState.mutate(
          {
            ...headerLayer,
            children: [avatarLayer, avatarLayer],
          },
          { dedup: false }
        )

        expect(graphState.resolve(headerLayer).children).toHaveLength(2)

        graphState.mutate({
          ...headerLayer,
          children: [avatarLayer],
        })

        expect(graphState.resolve(headerLayer).children).toHaveLength(1)
      })
    })

    it('should set value as link', () => {
      const graphState = createState()
      const layer = { _type: 'Layer', _id: 'custom' }
      const key = 'Layer:testKey'

      graphState.mutate({
        ...layer,
        children: [key],
        field: key,
      })

      expect(graphState.resolve(layer).children).toStrictEqual([key])
      expect(graphState.resolve(layer).field).toStrictEqual(key)
    })

    test.skip('should throw Error when recursive object', () => {
      const graphState = createState()
      const recursiveObject = {
        ...rootLayer,
        child: {
          ...headerLayer,
          recursive: 'Layer:root',
        },
      }

      expect(() => graphState.mutate(recursiveObject)).toThrowError(/Too deep/)
    })

    it('should merge nested fields', () => {
      const graphState = createState()
      graphState.mutate({
        ...rootLayer,
        options: {
          css: {
            overflow: 'hidden',
          },
          list: [10],
        },
      })

      graphState.mutate({
        ...rootLayer,
        options: {
          css: {
            display: 'none',
          },
        },
      })

      expect(Object.keys(graphState.resolve(rootLayer).options)).toEqual(expect.arrayContaining(['css', 'list']))
      expect(Object.keys(graphState.resolve(rootLayer).options.css)).toEqual(
        expect.arrayContaining(['overflow', 'display'])
      )

      graphState.mutate({
        ...rootLayer,
        options: {
          css: {
            list: [20],
          },
        },
      })

      expect(Object.keys(graphState.resolve(rootLayer).options)).toEqual(expect.arrayContaining(['css', 'list']))
      expect(Object.keys(graphState.resolve(rootLayer).options.css)).toEqual(expect.arrayContaining(['list']))
    })

    describe('replace', () => {
      it('should replace fields', () => {
        const graphState = createState()
        graphState.mutate({
          _type: 'Layer',
          _id: 'header',
          fields: {
            display: 'none',
          },
        })

        expect(Object.keys(graphState.resolve('Layer:header').fields)).toStrictEqual(['display', '_type', '_id'])

        graphState.mutate(
          {
            _type: 'Layer',
            _id: 'header',
            fields: {
              overflow: 'hidden',
            },
          },
          { replace: true }
        )

        expect(Object.keys(graphState.resolve('Layer:header').fields)).toStrictEqual(['overflow', '_type', '_id'])
      })

      it('should replace fields with string key', () => {
        const graphState = createState()
        graphState.mutate({
          _type: 'Layer',
          _id: 'header',
          fields: {
            display: 'none',
          },
        })

        expect(Object.keys(graphState.resolve('Layer:header').fields)).toStrictEqual(['display', '_type', '_id'])

        graphState.mutate(
          'Layer:header',
          {
            fields: {
              overflow: 'hidden',
            },
          },
          { replace: true }
        )
        expect(Object.keys(graphState.resolve('Layer:header').fields)).toStrictEqual(['overflow', '_type', '_id'])
      })

      it('should replace fields in nested link', () => {
        const graphState = createState()
        graphState.mutate({
          _type: 'Layer',
          _id: 'header',
          content: {
            _type: 'Property',
            _id: 'PropValue1',
            content: [1],
          },
        })

        expect(graphState.resolve('Property:PropValue1').content).toStrictEqual([1])

        graphState.mutate(
          {
            _type: 'Layer',
            _id: 'header',
            content: {
              _type: 'Property',
              _id: 'PropValue1',
              content: [2],
            },
          },
          { replace: true }
        )

        expect(graphState.resolve('Property:PropValue1').content).toStrictEqual([1, 2])
      })

      it('should replace with deep option', () => {
        const graphState = createState()
        graphState.mutate({
          _type: 'Layer',
          _id: 'header',
          content: {
            _type: 'Property',
            _id: 'PropValue1',
            content: [1],
          },
        })

        expect(graphState.resolve('Property:PropValue1').content).toStrictEqual([1])

        graphState.mutate(
          {
            _type: 'Layer',
            _id: 'header',
            content: {
              _type: 'Property',
              _id: 'PropValue1',
              content: [2],
            },
          },
          { replace: 'deep' }
        )

        expect(graphState.resolve('Property:PropValue1').content).toStrictEqual([2])
      })

      it('should replace array', () => {
        const graphState = createState()
        graphState.mutate({
          _type: 'Layer',
          _id: 'header',
          children: ['a', 'b'],
        })

        expect(graphState.resolve('Layer:header').children).toStrictEqual(['a', 'b'])

        graphState.mutate(
          {
            _type: 'Layer',
            _id: 'header',
            children: ['c', 'd'],
          },
          { replace: true }
        )
        expect(graphState.resolve('Layer:header').children).toStrictEqual(['c', 'd'])
      })

      it('should change order in array', () => {
        const updateSpy = vi.fn()

        const graphState = createState()
        graphState.mutate({
          _type: 'Layer',
          _id: 'header',
          children: ['Link:1', 'Link:2', 'Link:3'],
        })

        graphState.subscribe('Layer:header', updateSpy)

        expect(graphState.resolve('Layer:header').children).toStrictEqual(['Link:1', 'Link:2', 'Link:3'])

        graphState.mutate(
          'Layer:header',
          prev => {
            const children = prev?.children ?? []
            const index = children.indexOf('Link:1')

            if (index !== -1) {
              children.splice(index, 1)
              children.splice(2, 0, 'Link:1')
            }

            return {
              children,
            }
          },
          { replace: true }
        )

        expect(graphState.resolve('Layer:header').children).toStrictEqual(['Link:2', 'Link:3', 'Link:1'])
        expect(updateSpy).toBeCalledTimes(1)
        expect(updateSpy).toHaveBeenCalledWith(
          expect.objectContaining({ children: ['Link:2', 'Link:3', 'Link:1'] }),
          expect.objectContaining({ children: ['Link:1', 'Link:2', 'Link:3'] })
        )
      })

      it('should use replace function', () => {
        const replaceSpy = vi.fn()

        const graphState = createState()
        graphState.mutate({
          _type: 'Layer',
          _id: 'header',
          children: [
            { _type: 'Link', _id: 1, level: 10 },
            { _type: 'Link', _id: 2, level: 55 },
            { _type: 'Link', _id: 3, level: 73 },
          ],
        })

        expect(graphState.resolve('Layer:header').children).toStrictEqual(['Link:1', 'Link:2', 'Link:3'])

        graphState.mutate(
          'Layer:header',
          { children: ['Link:3', 'Link:2', 'Link:1'] },
          {
            replace: graph => {
              replaceSpy(graph)
              return graph._type === 'Layer'
            },
          }
        )

        expect(graphState.resolve('Layer:header', { deep: true }).children).toStrictEqual([
          expect.objectContaining({ _type: 'Link', _id: '3', level: 73 }),
          expect.objectContaining({ _type: 'Link', _id: '2', level: 55 }),
          expect.objectContaining({ _type: 'Link', _id: '1', level: 10 }),
        ])

        expect(replaceSpy).toBeCalledTimes(4)

        expect(replaceSpy).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({ children: ['Link:3', 'Link:2', 'Link:1'] })
        )
        expect(replaceSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({ _type: 'Link', _id: '3' }))
      })
    })

    describe('unlinking', () => {
      it('should unlink removed Graphs with replace', () => {
        const graphState = createState({
          initialState: {
            author: {
              _type: 'User',
              _id: 0,
              age: { _type: 'Age', _id: 0, value: 27 },
              skills: ['js', 'ts', { _type: 'Skill', _id: 'python' }],
            },
          },
        })

        const ageSpy = vi.fn()
        const skillSpy = vi.fn()

        graphState.subscribe('Age:0', ageSpy)
        graphState.subscribe('Skill:python', skillSpy)

        graphState.mutate('Age:0', { value: 25 })

        /**
         * Удаляем связь между Age:0 и User:0. Теперь при обновлении
         * User:0 age не будет оповещяться, до тех пор пока не будет заново
         * связан
         */
        graphState.mutate('User:0', { name: 'John', skills: ['go'] }, { replace: true })
        graphState.mutate('User:0', { name: 'Marcha' })

        /**
         * 1- когда изменили value
         * 2- когда удалили
         */
        expect(ageSpy).toBeCalledTimes(2)
        expect(skillSpy).toBeCalledTimes(1)

        /**
         * GarbageCollector автоматически удалит Age:0 т.к. на него больше никто не ссылается
         */

        expect(graphState.resolve('Age:0')).toBeNull()
        expect(graphState.resolve('Skill:python')).toBeNull()
      })

      it('should unlink removed Graphs without replace', () => {
        const graphState = createState({
          initialState: {
            author: {
              _type: 'User',
              _id: 0,
              age: 10,
            },
            skills: [
              { _type: 'Skill', _id: 'python' },
              { _type: 'Skill', _id: 'js' },
            ],
          },
        })

        const userSpy = vi.fn()

        graphState.subscribe('User:0', userSpy)
        graphState.mutate(graphState.key, { value: 25 })

        /**
         * Удаляем связь между User:0 и State. После того как мы
         * перезаписали поле author, User:0 больше не используется внутри
         * State и соответственно при изменении State, оповещать User:0 не нужно.
         */
        graphState.mutate(graphState.key, { author: 'OtherUser' })
        graphState.mutate(graphState.key, { value: 100 })

        expect(userSpy).toBeCalledTimes(2)
        expect(graphState.resolve('User:0')).toBeNull()

        graphState.mutate(graphState.key, { skills: [{ _type: 'Skill', _id: 'go' }] })

        expect(graphState.resolve('Skill:python')).not.toBeNull()
        expect(graphState.resolve('Skill:js')).not.toBeNull()
      })
    })
  })

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
        someProp: avatarLayer,
        children: [headerLayer],
      }
      graphState.mutate(root)
      graphState.mutate(graphState.keyOfEntity(root), {
        nested: {
          field: 'Post:100',
        },
      })

      const spyHeader = vi.fn()
      const spyAvatar = vi.fn()
      const spyPost = vi.fn()

      graphState.subscribe(headerLayer, spyHeader)
      graphState.subscribe(avatarLayer, spyAvatar)
      graphState.subscribe('Post:100', spyPost)
      graphState.mutate({
        ...rootLayer,
        overflow: 'x-hidden',
      })

      expect(spyAvatar).toBeCalledTimes(1)
      expect(spyHeader).toBeCalledTimes(1)
      expect(spyPost).toBeCalledTimes(1)
    })

    it('should notify if pass key as string', () => {
      const graphState = createState({
        initialState: {
          _type: 'Root',
          _id: 10,
          children: ['Header:20'],
        },
      })

      const spy = vi.fn()

      graphState.subscribe('Header:20', spy)
      graphState.mutate('Root:10', {
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

    describe('should skip notify if nothing was changed', () => {
      it('with primitive', () => {
        const momUser = { _type: 'User', _id: 'mom', name: 'Mom' }
        const user = { _type: 'User', _id: 'userId', name: 'John Doe', mom: momUser }
        const graphState = createState({ initialState: user })
        const spy = vi.fn()

        graphState.subscribe(user, spy)
        graphState.subscribe(momUser, spy)
        graphState.mutate(graphState.keyOfEntity(user), {
          name: 'John Doe',
        })
        graphState.mutate(graphState.keyOfEntity(momUser), {
          name: 'Mom',
        })

        expect(spy).toBeCalledTimes(0)
      })

      it('should be called once with nested object', () => {
        const graphState = createState({
          initialState: {
            _type: 'User',
            _id: 'one',
            name: 'John Doe',
            key: '100',
            characteristics: {
              gender: 'male',
              age: 20,
              traits: {
                openness: true,
                extroversion: true,
                humility: false,
              },
            },
          },
        })
        const spy = vi.fn()
        graphState.subscribe('User:one', spy)

        const updatedTraits = {
          traits: {
            openness: false,
            extroversion: false,
            humility: true,
            awareness: true,
            deepTraits: {
              illnesses: true,
            },
          },
        }

        graphState.mutate('User:one', prev => ({
          ...prev,
          characteristics: {
            ...prev.characteristics,
            ...updatedTraits,
          },
        }))

        graphState.mutate('User:one', prev => ({
          ...prev,
          characteristics: {
            ...prev.characteristics,
            ...updatedTraits,
          },
        }))
        expect(spy).toBeCalledTimes(1)
      })

      it('should be notify if change nested fields', () => {
        const state = createState({
          initialState: {
            user: {
              _type: 'User',
              _id: 1,
              params: {
                weight: 80,
              },
            },
          },
        })

        const spy = vi.fn()
        state.subscribe('User:1', spy)

        state.mutate('User:1', {
          params: {
            weight: 90,
          },
        })

        expect(spy).toBeCalledTimes(1)
        expect(spy).toBeCalledWith(
          expect.objectContaining({ params: expect.objectContaining({ weight: 90 }) }),
          expect.objectContaining({})
        )
      })
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

    it('should notify with updates an array', () => {
      const graphState = createState({
        initialState: {
          posts: [],
        },
      })

      const postsSpy = vi.fn()
      graphState.subscribe(graphState.key, postsSpy)

      graphState.mutate(graphState.key, {
        posts: ['postValue'],
      })
      graphState.mutate(graphState.key, {
        posts: ['Link:id'],
      })

      expect(postsSpy).toBeCalledTimes(2)
    })

    /**
     * Когда изменяем родителя, оповещаем всех детей
     */
    it('should notify nested tree', () => {
      const graphState = createState({
        initialState: {
          _type: 'Root',
          _id: 10,
          header: { _type: 'Header', _id: 20, children: [{ _type: 'Avatar', _id: 30 }] },
        },
      })

      const headerSpy = vi.fn()
      const avatarSpy = vi.fn()

      graphState.subscribe('Header:20', headerSpy)
      graphState.subscribe('Avatar:30', avatarSpy)
      graphState.mutate('Root:10', {
        visible: false,
      })

      expect(headerSpy).toBeCalledTimes(1)
      expect(avatarSpy).toBeCalledTimes(1)
    })

    it('should subscribe before create entity', () => {
      const header = { ...headerLayer, children: [avatarLayer] }
      const graphState = createState({ initialState: header })

      const headerSpy = vi.fn()

      graphState.subscribe(avatarLayer, headerSpy)
      graphState.mutate({
        ...headerLayer,
        field: 'test',
      })

      expect(headerSpy).toBeCalledTimes(1)
    })

    it('should unsubscribe', () => {
      const graphState = createState()
      graphState.mutate(rootLayer)
      const spy = vi.fn()
      const spy2 = vi.fn()

      graphState.subscribe(rootLayer, spy)
      const unsubscribe = graphState.subscribe(rootLayer, spy2)
      unsubscribe()

      graphState.mutate({
        ...rootLayer,
        children: ['test'],
      })

      expect(spy).toBeCalledTimes(1)
      expect(spy2).toBeCalledTimes(0)
    })

    it('should unsubscribe with Abort Controller', () => {
      const graphState = createState({
        initialState: {
          user: {
            _type: 'User',
            _id: '0',
          },
        },
      })

      const abortController = new AbortController()
      const subscribeUser = vi.fn()
      const subscribeAllState = vi.fn()

      graphState.subscribe('User:0', subscribeUser, {
        signal: abortController.signal,
      })
      graphState.subscribe(subscribeAllState, {
        signal: abortController.signal,
      })

      graphState.mutate('User:0', {
        age: 10,
      })

      expect(subscribeUser).toBeCalledTimes(1)
      expect(subscribeAllState).toBeCalledTimes(1)

      // Abort subscribes
      abortController.abort()

      graphState.mutate('User:0', {
        age: 20,
      })

      expect(subscribeUser).toBeCalledTimes(1)
      expect(subscribeAllState).toBeCalledTimes(1)
    })

    it('should return resolved newState', () => {
      const graphState = createState()
      const header = { ...headerLayer, display: 'block' }
      graphState.mutate(header)
      const spy = vi.fn()

      graphState.subscribe(header, spy)
      graphState.mutate({
        ...header,
        display: 'none',
      })

      expect(spy).toBeCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          display: 'none',
        }),
        expect.objectContaining({
          display: 'block',
        })
      )
    })

    it('should not return deep resolved data', () => {
      const graphState = createState()
      const header = { ...headerLayer, display: 'block', ref: rootLayer }
      graphState.mutate(header)
      const spy = vi.fn()

      graphState.subscribe(header, spy)
      graphState.mutate({
        ...header,
        display: 'none',
      })

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          display: 'none',
          ref: graphState.keyOfEntity(rootLayer),
        }),
        expect.objectContaining({
          display: 'block',
          ref: graphState.keyOfEntity(rootLayer),
        })
      )
    })

    it('should notify self store', () => {
      const graphState = createState()
      const spy = vi.fn()

      graphState.subscribe(spy)
      graphState.mutate(rootLayer)

      expect(spy).toBeCalledTimes(1)
    })

    it('should notify self store with each state', () => {
      const graphState = createState()
      const spy = vi.fn()

      let updateIndex = 0
      graphState.subscribe(data => {
        updateIndex++
        spy()
        switch (updateIndex) {
          case 1:
            return expect(data).toStrictEqual(avatarLayer)
          case 2:
            return expect(data).toStrictEqual(avatarLayer)
          case 4:
            return expect(data).toStrictEqual(avatarLayer)
          case 5:
            return expect(data).toMatchObject(avatarLayer)
          case 6:
            return expect(data).toMatchObject(graphState.resolve(graphState.keyOfEntity(rootLayer)))
        }
      })
      graphState.mutate({
        ...rootLayer,
        children: [avatarLayer],
        user: {
          avatarLayer,
        },
        header: avatarLayer,
      })

      expect(spy).toBeCalledTimes(9)
    })

    it('should notify only when selected values change', () => {
      const initialState = {
        _type: 'Root',
        _id: '10',
        header: {
          _type: 'Header',
          _id: '20',
          width: 20,
          height: 20,
          field: true,
        },
      }

      const graphState = createState({
        initialState,
      })
      const results = []
      const spy = vi.fn()

      graphState.subscribe('Header:20', spy, {
        selector: graph => {
          results.push(graph)
          return { width: graph.width, height: graph.height, field: graph.field }
        },
      })
      graphState.mutate('Header:20', {
        height: 30,
      })
      graphState.mutate('Header:20', {
        padding: 30,
      })

      expect(spy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ width: 20, height: 30 }),
        expect.objectContaining({ width: 20, height: 20 })
      )

      expect(results[1]).toEqual({ ...initialState.header, height: 20 })
      expect(results[0]).toEqual({ ...initialState.header, height: 30 })

      /*
      Проверяем что булевые значения влияют на notify
       */
      graphState.mutate('Header:20', {
        field: false,
      })
      graphState.mutate('Header:20', {
        field: true,
      })

      expect(spy).toBeCalledTimes(3)
    })

    it('should notify when value fully deleted', () => {
      const initialState = {
        _type: 'Root',
        _id: '10',
        header: {
          _type: 'Header',
          _id: '20',
          width: 20,
          height: 20,
          field: true,
        },
      }

      const graphState = createState({
        initialState,
      })
      const results = []
      const spy = vi.fn()

      graphState.subscribe('Root:10', spy, {
        selector: graph => {
          results.push(graph)
          return { header: graph.header }
        },
      })

      graphState.mutate(
        'Root:10',
        prev => {
          const prevCopy = { ...prev }
          delete prevCopy.header
          return prevCopy
        },
        { replace: true }
      )

      expect(spy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ header: undefined }),
        expect.objectContaining({ header: 'Header:20' })
      )

      expect(results[0]).toEqual({ _type: 'Root', _id: '10' })
      expect(results[1]).toEqual({ _type: 'Root', _id: '10', header: 'Header:20' })
    })

    it('should notify after invalidate and selector should return only graph', () => {
      const initialState = {
        _type: 'Root',
        _id: '10',
        header: {
          _type: 'Header',
          _id: '20',
          width: 20,
          height: 20,
          field: true,
          properties: [{ type: 'string' }, { value: 'string' }],
        },
      }

      const graphState = createState({
        initialState,
      })
      const spy = vi.fn()
      const selectorSpy = vi.fn()

      graphState.subscribe(initialState, spy, {
        selector: graph => {
          selectorSpy(graph)
          return graph.header
        },
      })

      graphState.invalidate('Header:20')
      expect(spy).toHaveBeenNthCalledWith(1, expect.objectContaining(null), expect.stringContaining('Header:20'))
      graphState.mutate(initialState)
      expect(spy.mock.calls[1]).toEqual(['Header:20', null])
      selectorSpy.mock.calls.forEach(args => {
        expect(args[0]).not.toBeNull()
        expect(args[0]).not.toBeUndefined()
      })
    })
  })

  describe('plugins', () => {
    it('should invoke plugin body', () => {
      const pluginBodySpy = vi.fn()

      const plugin: Plugin = graphState => {
        pluginBodySpy(graphState)

        return graphState
      }

      const graphState = createState({
        plugins: [plugin],
      })

      expect(pluginBodySpy).toBeCalledTimes(1)
      expect(pluginBodySpy).toBeCalledWith(graphState)
    })

    it('should invoke few plugins', () => {
      const firstPluginBodySpy = vi.fn()
      const secondPluginBodySpy = vi.fn()

      const firstPlugin: Plugin = graphState => {
        firstPluginBodySpy(graphState)
        return graphState
      }
      const secondPlugin: Plugin = graphState => {
        secondPluginBodySpy(graphState)
        return graphState
      }

      const graphState = createState({
        plugins: [firstPlugin, secondPlugin],
      })

      expect(firstPluginBodySpy).toBeCalledTimes(1)
      expect(firstPluginBodySpy).toBeCalledWith(graphState)

      expect(secondPluginBodySpy).toBeCalledTimes(1)
      expect(secondPluginBodySpy).toBeCalledWith(graphState)
    })

    it('should mutate graphState state', () => {
      const fn = vi.fn(() => 'test')

      const plugin: Plugin = graphState => {
        graphState.testMethod = fn
        return graphState
      }

      const graphState = createState({
        plugins: [plugin],
      })

      expect(graphState).toHaveProperty('testMethod')

      graphState.testMethod()
      expect(fn).toReturnWith('test')
    })

    it('should mutate graphState state with few plugins', () => {
      const pluginFirstMethod = vi.fn(() => 'first')
      const pluginSecondMethod = vi.fn(() => 'second')

      const firstPlugin: Plugin = graphState => {
        graphState.firstMethod = pluginFirstMethod
        return graphState
      }

      const secondPlugin: Plugin = graphState => {
        graphState.secondMethod = pluginSecondMethod
        return graphState
      }

      const graphState = createState({
        plugins: [firstPlugin, secondPlugin],
      })

      expect(graphState).toHaveProperty('firstMethod')
      expect(graphState).toHaveProperty('secondMethod')

      graphState.firstMethod()
      expect(pluginFirstMethod).toReturnWith('first')

      graphState.secondMethod()
      expect(pluginSecondMethod).toReturnWith('second')
    })

    it('should call plugin method inside other plugin', () => {
      const pluginFirstMethod = vi.fn(() => 'first')
      const pluginSecondMethod = vi.fn(() => 'second')

      const firstPlugin: Plugin = graphState => {
        graphState.firstMethod = pluginFirstMethod
        return graphState
      }

      const secondPlugin: Plugin = graphState => {
        expect(graphState).toHaveProperty('firstMethod')

        graphState.firstMethod()
        expect(pluginFirstMethod).toReturnWith('first')

        graphState.secondMethod = pluginSecondMethod
        return graphState
      }

      const graphState = createState({
        plugins: [firstPlugin, secondPlugin],
      })

      graphState.firstMethod()
      expect(pluginFirstMethod).toReturnWith('first')

      graphState.secondMethod()
      expect(pluginSecondMethod).toReturnWith('second')
    })

    it('should not throw if plugin dont return graphState', () => {
      const pluginMethod = vi.fn(() => 'first')

      const plugin: Plugin = graphState => {
        graphState.method = pluginMethod
      }

      const graphState = createState({
        plugins: [plugin],
      })

      expect(() => graphState.method()).not.toThrow()
      expect(pluginMethod).toReturnWith('first')
      expect(graphState).toBeInstanceOf(Object)
    })

    it('should register differed plugin', () => {
      const state = createState({
        _type: 'Test',
        plugins: [
          state => {
            state.initialPlugin = 1
          },
        ],
      })
      state.use(state => {
        state.version = '1.1'

        expect(state._type).toBe('Test')
        expect(state.initialPlugin).toBe(1)
      })

      expect(state.version).toBe('1.1')
    })
  })

  // describe('onDebugEvent', () => {
  //   it('should notify events', () => {
  //     const spyHandler = vi.fn()
  //     const state = createState()
  //
  //     state.onDebugEvent(spyHandler)
  //
  //     expect(spyHandler.)
  //   })
  // })

  describe('resolve', () => {
    const graphState = createState()
    graphState.mutate({
      ...rootLayer,
      children: [{ ...headerLayer, children: [{ ...avatarLayer, width: sizeVariable, height: sizeVariable }] }],
    })

    const resolvedAvatar = {
      ...avatarLayer,
      width: graphState.keyOfEntity(sizeVariable),
      height: graphState.keyOfEntity(sizeVariable),
    }

    it('should resolve by entity', () => {
      expect(graphState.resolve({ _type: 'Layer', _id: 'avatar' })).toStrictEqual(resolvedAvatar)
      expect(graphState.resolve({ _type: 'Variable', _id: 'size' })).toStrictEqual(sizeVariable)
    })

    it('should return null if pass not graph entity', () => {
      expect(graphState.resolve({ _type: 'Layer', _idWrong: 'avatar' })).toBe(null)
    })

    it('should resolve by key', () => {
      expect(graphState.resolve('Layer:avatar')).toStrictEqual(resolvedAvatar)
      expect(graphState.resolve('Variable:size')).toStrictEqual(sizeVariable)
    })

    it('should resolve nested layers', () => {
      expect(graphState.resolve('Layer:root')).toStrictEqual({
        ...rootLayer,
        children: [graphState.keyOfEntity(headerLayer)],
      })
    })

    it('should resolve State', () => {
      const initial = {
        about: 'Hello',
        layers: [10],
      }
      const graphState = createState({
        initialState: initial,
      })

      expect(graphState.resolve(graphState)).toMatchObject(initial)
      expect(graphState.resolve(graphState.key)).toMatchObject(initial)
    })

    it('should resolve non-graph deep values and return references for graph links', () => {
      const graphState = createState({
        initialState: {
          _type: 'Root',
          _id: 'id',
          nested: [{ value: 1 }, headerLayer],
          graph: { ...headerLayer },
        },
      })

      expect(graphState.resolve('Root:id')).toStrictEqual({
        _type: 'Root',
        _id: 'id',
        nested: [{ value: 1, _type: 'Root', _id: 'id.nested.0' }, 'Layer:header'],
        graph: 'Layer:header',
      })
    })

    it('should resolve State with nested values', () => {
      const initial = {
        _type: 'Root',
        _id: 'id',
        nested: [
          headerLayer,
          {
            fields: {
              _type: 'Field',
              _id: '1',
              nested: [
                {
                  deepNested: [{ deepNested: 1 }, { deepNested: 2 }, { deepNested: 3 }, headerLayer],
                },
              ],
            },
          },
          {
            fields: {
              _type: 'Field',
              _id: '2',
              nested: [{ field: 2 }, headerLayer],
            },
          },
          {
            fields: {
              _type: 'Field',
              _id: '3',
              nested: [{ field: 3 }, headerLayer],
            },
          },
        ],
      }

      const graphState = createState({
        initialState: initial,
      })

      expect(graphState.resolve('Root:id', { deep: true })).toMatchObject(initial)
    })

    it('should resolve State without initial state', () => {
      const graphState = createState()
      expect(graphState.resolve()).toBe(null)
    })

    it('should have unique link', () => {
      const linkOne = graphState.resolve('Layer:root')
      const linkTwo = graphState.resolve('Layer:root')
      expect(linkOne === linkTwo).not.toBeTruthy()
    })

    /**
     * Если зарезолвить граф, которого не существует, то вернет null
     */
    it('unsafe resolve', () => {
      const graphState = createState({
        initialState: {
          post: { _type: 'Post', _id: 'postId' },
          layer: { _type: 'Layer', _id: '10' },
        },
      })

      expect(graphState.resolve(graphState, { safe: false, deep: true })).toMatchObject({
        post: { _type: 'Post', _id: 'postId' },
      })

      graphState.invalidate('Post:postId')
      expect(graphState.resolve(graphState, { safe: false })).toMatchObject({
        post: null,
        layer: 'Layer:10',
      })
    })

    it('invalid field', () => {
      const initial = {
        about: 'Hello',
        layers: [10],
      }
      const graphState = createState({
        initialState: initial,
      })

      expect(graphState.resolve()).toBe(null)
      expect(graphState.resolve('')).toBe(null)
      expect(graphState.resolve('', { safe: true })).toBe('')
      expect(graphState.resolve('', { safe: false })).toBe(null)
      expect(graphState.resolve(10)).toBe(null)
      expect(graphState.resolve(10, { safe: true })).toBe(10)
      expect(graphState.resolve(10, { safe: false })).toBe(null)
    })

    it('should resolve selected value with deep option', () => {
      const initialState = {
        _type: 'Root',
        _id: '10',
        header: {
          _type: 'Header',
          _id: '20',
          width: 20,
          height: 20,
          field: true,
        },
      }

      const graphState = createState({
        initialState,
      })

      const result = graphState.resolve(initialState, {
        deep: true,
        selector: graph => {
          return graph.header
        },
      })

      expect(result).toEqual(initialState.header)
    })
  })

  describe('safeResolve', () => {
    it('should return value it pass not graph entity', () => {
      const graphState = createState({
        initialState: rootLayer,
      })

      expect(graphState.safeResolve(10)).toBe(10)

      /**
       * If till Layer:valid is not exist, it will return Layer:root string
       */
      expect(graphState.safeResolve('Layer:valid')).toStrictEqual('Layer:valid')
      expect(graphState.safeResolve(rootLayer)).toStrictEqual(rootLayer)
    })
  })

  describe('resolveParents', () => {
    const graphState = createState()

    it('should resolve one parent', () => {
      const root = {
        ...rootLayer,
        field: avatarLayer,
      }
      graphState.mutate(root)

      expect(graphState.resolveParents(avatarLayer)).toStrictEqual([graphState.resolve(root)])
    })

    it('should resolve parents', () => {
      const root = {
        ...rootLayer,
        field: avatarLayer,
      }

      const header = {
        ...headerLayer,
        field: avatarLayer,
      }
      graphState.mutate(root)
      graphState.mutate(header)

      expect(graphState.resolveParents(avatarLayer)).toStrictEqual([
        graphState.resolve(root),
        graphState.resolve(header),
      ])
    })

    it('invalid field', () => {
      expect(graphState.resolveParents('')).toStrictEqual([])
      expect(graphState.resolveParents(10)).toStrictEqual([])
      expect(graphState.resolveParents()).toStrictEqual([])
    })
  })

  describe('getArgumentsForMutate', () => {
    it('should collect entity arguments', () => {
      const state = createState()

      const { graphKey, data, options } = state.getArgumentsForMutate({ _type: 'Layer', _id: 'root', value: 10 })

      expect(graphKey).toBe('Layer:root')
      expect(data).toMatchObject({ _type: 'Layer', _id: 'root', value: 10 })
      expect(options).toBeUndefined()
    })

    it('should collect entity arguments with options', () => {
      const state = createState()

      const { graphKey, data, options } = state.getArgumentsForMutate(
        { _type: 'Layer', _id: 'root', value: 10 },
        { replace: true }
      )

      expect(graphKey).toBe('Layer:root')
      expect(data).toMatchObject({ _type: 'Layer', _id: 'root', value: 10 })
      expect(options).toMatchObject({ replace: true })
    })

    it('should collect LinkKey', () => {
      const state = createState()

      const { graphKey, data, options } = state.getArgumentsForMutate('Layer:root', { value: 10 })

      expect(graphKey).toBe('Layer:root')
      expect(data).toMatchObject({ value: 10 })
      expect(options).toBeUndefined()
    })

    it('should collect LinkKey with options', () => {
      const state = createState()

      const { graphKey, data, options } = state.getArgumentsForMutate('Layer:root', { value: 10 }, { replace: true })

      expect(graphKey).toBe('Layer:root')
      expect(data).toMatchObject({ value: 10 })
      expect(options).toMatchObject({ replace: true })
    })

    it('should collect LinkKey with setter function', () => {
      const callbackSpy = vi.fn()
      const state = createState({
        initialState: {
          l: { _type: 'Layer', _id: 'root', value: 20 },
        },
      })

      const { graphKey, data, options } = state.getArgumentsForMutate('Layer:root', prev => {
        callbackSpy(prev)
        return { value: 10 }
      })

      expect(graphKey).toBe('Layer:root')
      expect(data).toMatchObject({ value: 10 })
      expect(options).toBeUndefined()
      expect(callbackSpy).toBeCalledTimes(1)
      expect(callbackSpy).toHaveBeenCalledWith({ _type: 'Layer', _id: 'root', value: 20 })
    })
  })

  describe('circular', () => {
    it('should create state with circular deps', () => {
      const state = createState({
        _id: '100',
        initialState: {
          user: {
            _type: 'User',
            _id: '1',
            profile: {
              _type: 'Profile',
              _id: 10,
              circular: 'User:1',
            },
            skills: [
              {
                _type: 'Skill',
                _id: 'js',
                user: 'User:1',
              },
              'User:1',
            ],
            value: 'User:1',
          },
        },
      })

      expect(state.key).toBe('State:100')
      expect(() => state.resolve(state.key, { deep: true })).not.toThrow()
      expect(state.resolve('Profile:10')).toStrictEqual({
        _type: 'Profile',
        _id: '10',
        circular: null,
      })
      expect(state.resolve('User:1').skills.length).toBe(1)
    })

    it('should resolve deep value with keep links', () => {
      const state = createState({
        _id: '100',
        initialState: {
          user: {
            _type: 'User',
            _id: '1',
            profile: {
              _type: 'Profile',
              _id: 10,
              circular: 'User:1',
            },
          },
        },
      })

      expect(() => state.resolve('User:1', { deep: true })).not.toThrow()
      expect(state.resolve('User:1', { deep: true })).toMatchObject({
        _type: 'User',
        _id: '1',
        profile: {
          _type: 'Profile',
          _id: '10',
          circular: null,
        },
      })

      expect(state.resolve('Profile:10', { deep: true })).toStrictEqual({
        _type: 'Profile',
        _id: '10',
        circular: null,
      })
    })

    it('should skip circular notify', () => {
      const state = createState({
        _id: '100',
        initialState: {
          user: {
            _type: 'User',
            _id: '1',
            profile: {
              _type: 'Profile',
              _id: 10,
              circular: null,
            },
          },
        },
      })

      const userSubscribe = vi.fn()
      const profileSubscribe = vi.fn()
      state.subscribe('User:1', userSubscribe)
      state.subscribe('Profile:10', profileSubscribe)

      state.mutate('User:1', { v: 1 })

      expect(userSubscribe).toBeCalledTimes(1)
      expect(profileSubscribe).toBeCalledTimes(1)

      state.mutate('Profile:10', { v: 2 })

      expect(userSubscribe).toBeCalledTimes(1)
      expect(profileSubscribe).toBeCalledTimes(2)
    })
  })
})
