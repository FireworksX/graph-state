import { describe, it, expect } from 'vitest'
import { createLinkRefs } from '../createLinkRefs'

describe('CreateLinkRefs', () => {
  it('should add new ref', () => {
    const linkRefs = createLinkRefs()

    linkRefs.addRefs('target', 'one')
    expect(linkRefs.getLinkedRefs('target')).toStrictEqual(['one'])
  })

  it('should push new ref', () => {
    const linkRefs = createLinkRefs()

    linkRefs.addRefs('target', 'one')
    linkRefs.addRefs('target', 'two')
    expect(linkRefs.getLinkedRefs('target')).toStrictEqual(['one', 'two'])
  })

  it('should skip duplicates while adding new', () => {
    const linkRefs = createLinkRefs()

    linkRefs.addRefs('target', 'one')
    linkRefs.addRefs('target', 'one')
    linkRefs.addRefs('target', 'two')
    expect(linkRefs.getLinkedRefs('target')).toStrictEqual(['one', 'two'])
  })

  it('should return nested refs', () => {
    const linkRefs = createLinkRefs()

    linkRefs.addRefs('target', 'one')
    linkRefs.addRefs('target2', 'target')

    expect(linkRefs.getLinkedRefs('target2')).toStrictEqual(['target', 'one'])
  })

  it('should invalidate depend links', () => {
    const refs = createLinkRefs()

    refs.addRefs('NestedChild', 'ChildOne')
    refs.addRefs('ChildOne', 'Parent')
    refs.addRefs('ChildTwo', 'Parent')

    refs.invalidateRef('ChildOne')

    expect(refs.getChildren('Parent')).toStrictEqual(['ChildTwo'])
    expect(refs.getParents('ChildOne')).toStrictEqual(undefined)
    expect(refs.getParents('ChildTwo')).toStrictEqual(['Parent'])
  })
})
