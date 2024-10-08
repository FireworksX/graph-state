import { describe, it, expect } from 'vitest'
import { createCache } from '../cache'
import { createState } from '../createState'

describe('createCache', () => {
  it('should add new ref', () => {
    const linkRefs = createCache()

    linkRefs.addRefs('target', 'one')
    expect(linkRefs.getLinkedRefs('target')).toStrictEqual(['one'])
  })

  it('should push new ref', () => {
    const linkRefs = createCache()

    linkRefs.addRefs('target', 'one')
    linkRefs.addRefs('target', 'two')
    expect(linkRefs.getLinkedRefs('target')).toStrictEqual(['one', 'two'])
  })

  it('should remove refs', () => {
    const linkRefs = createCache()

    linkRefs.addRefs('Type:1', 'Target:0')
    linkRefs.addRefs('Type:2', 'Target:0')
    expect(linkRefs.getChildren('Target:0')).toStrictEqual(['Type:1', 'Type:2'])

    linkRefs.removeRefs('Target:0', 'Type:2')
    expect(linkRefs.getChildren('Target:0')).toStrictEqual(['Type:1'])
  })

  it('should skip duplicates while adding new', () => {
    const linkRefs = createCache()

    linkRefs.addRefs('target', 'one')
    linkRefs.addRefs('target', 'one')
    linkRefs.addRefs('target', 'two')
    expect(linkRefs.getLinkedRefs('target')).toStrictEqual(['one', 'two'])
  })

  it('should return nested refs', () => {
    const linkRefs = createCache()

    linkRefs.addRefs('target', 'one')
    linkRefs.addRefs('target2', 'target')

    expect(linkRefs.getLinkedRefs('target2')).toStrictEqual(['target', 'one'])
  })

  it('should invalidate depend links', () => {
    const refs = createCache()

    refs.addRefs('NestedChild', 'ChildOne')
    refs.addRefs('ChildOne', 'Parent')
    refs.addRefs('ChildTwo', 'Parent')

    refs.invalidate('ChildOne')

    expect(refs.getChildren('Parent')).toStrictEqual(['ChildTwo'])
    expect(refs.getParents('ChildOne')).toStrictEqual(undefined)
    expect(refs.getParents('ChildTwo')).toStrictEqual(['Parent'])
  })

  it('should remove link when invalidate', () => {
    const graphState = createState()
    graphState.mutate({
      _type: 'User',
      _id: 'id1',
    })
    graphState.mutate({
      _type: 'User',
      _id: 'id2',
    })

    expect(graphState.inspectFields('User')).toStrictEqual(['User:id1', 'User:id2'])
    graphState.invalidate('User:id1')
    expect(graphState.inspectFields('User')).toStrictEqual(['User:id2'])
  })

  describe('links', () => {
    it('should add new link', () => {
      const linkRefs = createCache()

      linkRefs.writeLink('target', 'one')
      linkRefs.writeLink('User:123', { id: 123 })
      expect(linkRefs.readLink('target')).toStrictEqual('one')
      expect(linkRefs.readLink('User:123')).toStrictEqual({ id: 123 })
    })

    it('should rewrite link', () => {
      const linkRefs = createCache()

      linkRefs.writeLink('User:123', { id: 123 })
      expect(linkRefs.readLink('User:123')).toStrictEqual({ id: 123 })
      linkRefs.writeLink('User:123', { id: 321 })
      expect(linkRefs.readLink('User:123')).toStrictEqual({ id: 321 })

      linkRefs.writeLink('target', 'one')
      expect(linkRefs.readLink('target')).toStrictEqual('one')
      linkRefs.writeLink('target', 'two')
      expect(linkRefs.readLink('target')).toStrictEqual('two')
    })

    it('hasLink', () => {
      const linkRefs = createCache()

      linkRefs.writeLink('target', 'one')
      linkRefs.writeLink('target2', 'two')
      expect(linkRefs.hasLink('target')).toBeTruthy()
      expect(linkRefs.hasLink('target2')).toBeTruthy()
    })

    it('should add new link with dep', () => {
      const linkRefs = createCache()

      linkRefs.writeLink('User:123', { id: 123 }, 'dep')
      expect(linkRefs.getLinkedRefs('User:123')).toStrictEqual(['dep'])
    })
  })
})
