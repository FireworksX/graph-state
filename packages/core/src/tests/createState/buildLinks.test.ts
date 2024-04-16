import { createState } from 'src'
import { avatarLayer, headerLayer, sizeVariable } from '../helpers'
import { isHTMLNode } from '@adstore/utils'

export const buildLinksTest = () => {
  const statex = createState()

  describe('buildLinks', () => {
    it('should skip not Entity types', () => {
      expect(statex.buildLinks(sizeVariable)).toStrictEqual(sizeVariable)
      expect(statex.buildLinks(10)).toBe(10)
      expect(statex.buildLinks(undefined)).toBe(undefined)
    })

    it('should build first level links', () => {
      const avatar = {
        ...avatarLayer,
        width: sizeVariable,
        height: sizeVariable
      }

      expect(statex.buildLinks(avatar)).toStrictEqual({
        ...avatarLayer,
        width: statex.keyOfEntity(sizeVariable),
        height: statex.keyOfEntity(sizeVariable)
      })
    })

    it('should build nested links', () => {
      const avatar = {
        ...avatarLayer,
        width: statex.keyOfEntity(sizeVariable),
        height: statex.keyOfEntity(sizeVariable)
      }

      const header = {
        ...headerLayer,
        children: [avatar],
        width: sizeVariable
      }

      expect(statex.buildLinks(header)).toStrictEqual({
        ...headerLayer,
        width: statex.keyOfEntity(sizeVariable),
        children: [statex.keyOfEntity(avatarLayer)]
      })
    })

    it('should skip HTML node', () => {
      const htmlNode = global.document.createElement('div')
      const domLayer = {
        _type: 'Layer',
        _id: 'dom',
        value: htmlNode
      }

      expect(isHTMLNode(statex.buildLinks(domLayer)?.value)).toBeTruthy()
    })
  })
}
