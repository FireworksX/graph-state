import { describe, expect, it } from 'vitest'
import { createState, keyOfEntity } from 'src'
import { avatarLayer, headerLayer, rootLayer } from '../helpers'
import { isHTMLNode } from 'src/utils/checker'

describe('createState', () => {
  describe('mutate', () => {
    it('should mutate with string key', () => {
      const statex = createState()
      statex.mutate('Layer:header', {
        overflow: 'hidden',
      })

      expect(statex.resolve(headerLayer).overflow).toBe('hidden')

      statex.mutate('Layer:header', {
        overflow: 'auto',
      })

      expect(statex.resolve(headerLayer).overflow).toBe('auto')
    })

    it('should mutate with function setter', () => {
      const statex = createState()
      statex.mutate('Layer:header', {
        overflow: 'hidden',
        image: avatarLayer,
      })

      expect(statex.resolve(headerLayer).overflow).toBe('hidden')
      expect(statex.resolve(headerLayer).image).toBe(keyOfEntity(avatarLayer))

      statex.mutate('Layer:header', prev => {
        expect(prev).toStrictEqual({ ...headerLayer, overflow: 'hidden', image: keyOfEntity(avatarLayer) })

        return {
          overflow: `${prev.overflow}+auto`,
        }
      })

      expect(statex.resolve(headerLayer).overflow).toBe('hidden+auto')
    })

    it('should mutate layer property', () => {
      const statex = createState()
      statex.mutate({
        ...headerLayer,
        overflow: 'hidden',
      })

      expect(statex.resolve(headerLayer).overflow).toBe('hidden')

      statex.mutate({
        ...headerLayer,
        overflow: 'auto',
      })

      expect(statex.resolve(headerLayer).overflow).toBe('auto')
    })

    it('should add new layer property', () => {
      const statex = createState()
      statex.mutate({
        ...headerLayer,
        opacity: 0.7,
      })

      expect(Object.keys(statex.resolve(headerLayer))).toStrictEqual(['_type', '_id', 'opacity'])
      expect(statex.resolve(headerLayer).opacity).toBe(0.7)

      statex.mutate({
        ...headerLayer,
        opacity: 1,
        overflow: 'auto',
      })

      expect(Object.keys(statex.resolve(headerLayer))).toStrictEqual(['_type', '_id', 'opacity', 'overflow'])
      expect(statex.resolve(headerLayer).opacity).toBe(1)
      expect(statex.resolve(headerLayer).overflow).toBe('auto')
    })

    it('should append new item in array', () => {
      const statex = createState()
      statex.mutate({
        ...headerLayer,
        children: [],
      })

      statex.mutate({
        ...headerLayer,
        children: [avatarLayer],
      })

      expect(statex.resolve(headerLayer).children).toHaveLength(1)
      expect(statex.resolve(headerLayer).children).toStrictEqual([keyOfEntity(avatarLayer)])

      statex.mutate({
        ...headerLayer,
        children: [rootLayer],
      })

      expect(statex.resolve(headerLayer).children).toHaveLength(2)
      expect(statex.resolve(headerLayer).children).toStrictEqual([keyOfEntity(avatarLayer), keyOfEntity(rootLayer)])
    })

    it('should skip duplicate item in array', () => {
      const statex = createState()
      statex.mutate({
        ...headerLayer,
        children: [],
      })

      statex.mutate({
        ...headerLayer,
        children: [avatarLayer],
      })

      expect(statex.resolve(headerLayer).children).toHaveLength(1)

      statex.mutate({
        ...headerLayer,
        children: [avatarLayer],
      })

      expect(statex.resolve(headerLayer).children).toHaveLength(1)
    })

    it('should set value as link', () => {
      const statex = createState()
      const layer = { _type: 'Layer', _id: 'custom' }
      const key = 'Layer:testKey'

      statex.mutate({
        ...layer,
        children: [key],
        field: key,
      })

      expect(statex.resolve(layer).children).toStrictEqual([key])
      expect(statex.resolve(layer).field).toStrictEqual(key)
    })

    it('should replace fields', () => {
      const statex = createState()
      statex.mutate({
        _type: 'Layer',
        _id: 'header',
        fields: {
          display: 'none',
        },
      })

      expect(Object.keys(statex.resolve('Layer:header').fields)).toStrictEqual(['display'])

      statex.mutate(
        {
          _type: 'Layer',
          _id: 'header',
          fields: {
            overflow: 'hidden',
          },
        },
        { replace: true }
      )
      expect(Object.keys(statex.resolve('Layer:header').fields)).toStrictEqual(['overflow'])
    })

    it('should replace fields with string key', () => {
      const statex = createState()
      statex.mutate({
        _type: 'Layer',
        _id: 'header',
        fields: {
          display: 'none',
        },
      })

      expect(Object.keys(statex.resolve('Layer:header').fields)).toStrictEqual(['display'])

      statex.mutate(
        'Layer:header',
        {
          fields: {
            overflow: 'hidden',
          },
        },
        { replace: true }
      )
      expect(Object.keys(statex.resolve('Layer:header').fields)).toStrictEqual(['overflow'])
    })

    it('should replace fields in nested link', () => {
      const statex = createState()
      statex.mutate({
        _type: 'Layer',
        _id: 'header',
        content: {
          _type: 'Property',
          _id: 'PropValue1',
          content: [1],
        },
      })

      expect(statex.resolve('Property:PropValue1').content).toStrictEqual([1])

      statex.mutate(
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
      expect(statex.resolve('Property:PropValue1').content).toStrictEqual([2])
    })

    it('should replace array', () => {
      const statex = createState()
      statex.mutate({
        _type: 'Layer',
        _id: 'header',
        children: ['a', 'b'],
      })

      expect(statex.resolve('Layer:header').children).toStrictEqual(['a', 'b'])

      statex.mutate(
        {
          _type: 'Layer',
          _id: 'header',
          children: ['c', 'd'],
        },
        { replace: true }
      )
      expect(statex.resolve('Layer:header').children).toStrictEqual(['c', 'd'])
    })

    it('should throw Error when recursive object', () => {
      const statex = createState()
      const recursiveObject = {
        ...rootLayer,
        child: {
          ...headerLayer,
          recursive: 'Layer:root',
        },
      }

      expect(() => statex.mutate(recursiveObject)).toThrowError(/Too deep notify./)
    })

    it('should not merge nested fields', () => {
      const statex = createState()
      statex.mutate({
        ...rootLayer,
        options: {
          css: {
            overflow: 'hidden',
          },
          list: [10],
        },
      })

      statex.mutate({
        ...rootLayer,
        options: {
          css: {
            display: 'none',
          },
        },
      })

      expect(Object.keys(statex.resolve(rootLayer).options)).toStrictEqual(['css', 'list'])
      expect(Object.keys(statex.resolve(rootLayer).options.css)).toStrictEqual(['display'])

      statex.mutate({
        ...rootLayer,
        options: {
          css: {
            list: [20],
          },
        },
      })

      expect(Object.keys(statex.resolve(rootLayer).options)).toStrictEqual(['css', 'list'])
      expect(Object.keys(statex.resolve(rootLayer).options.css)).toStrictEqual(['list'])
    })

    it('should skip HTML node', () => {
      const statex = createState()

      const htmlNode = global.document.createElement('div')
      const domLayer = {
        _type: 'Layer',
        _id: 'dom',
        value: htmlNode,
      }

      statex.mutate(domLayer)
      expect(isHTMLNode(statex.resolve(domLayer)?.value)).toBeTruthy()

      const domArrayLayer = {
        _type: 'Layer',
        _id: 'domArray',
        value: [htmlNode],
      }

      statex.mutate(domArrayLayer)
      statex.resolve(domArrayLayer).value.forEach(node => {
        expect(isHTMLNode(node)).toBeTruthy()
      })
    })
  })
})
