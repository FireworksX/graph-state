import { describe, expect, it } from 'vitest'
import { createState, keyOfEntity } from 'src'
import { avatarLayer, headerLayer, sizeVariable } from '../helpers'
import { isHTMLNode } from 'src/utils/checker'

describe('createState', () => {
  const graphState = createState()

  describe('buildLinks', () => {
    it('should skip not Entity types', () => {
      expect(graphState.buildLinks(sizeVariable)).toStrictEqual(sizeVariable)
      expect(graphState.buildLinks(10)).toBe(10)
      expect(graphState.buildLinks(undefined)).toBe(undefined)
    })

    it('should build first level links', () => {
      const avatar = {
        ...avatarLayer,
        width: sizeVariable,
        height: sizeVariable,
      }

      expect(graphState.buildLinks(avatar)).toStrictEqual({
        ...avatarLayer,
        width: keyOfEntity(sizeVariable),
        height: keyOfEntity(sizeVariable),
      })
    })

    it('should build nested links', () => {
      const avatar = {
        ...avatarLayer,
        width: keyOfEntity(sizeVariable),
        height: keyOfEntity(sizeVariable),
      }

      const header = {
        ...headerLayer,
        children: [avatar],
        width: sizeVariable,
      }

      expect(graphState.buildLinks(header)).toStrictEqual({
        ...headerLayer,
        width: keyOfEntity(sizeVariable),
        children: [keyOfEntity(avatarLayer)],
      })
    })

    it('should skip HTML node', () => {
      const htmlNode = global.document.createElement('div')
      const domLayer = {
        _type: 'Layer',
        _id: 'dom',
        value: htmlNode,
      }

      expect(isHTMLNode(graphState.buildLinks(domLayer)?.value)).toBeTruthy()
    })
  })
})
