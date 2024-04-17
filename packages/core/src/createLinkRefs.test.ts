import { describe, it, expect } from 'vitest'
import { createLinkRefs } from 'src/createLinkRefs'

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

    refs.addRefs('target', 'dep1')
    refs.addRefs('target', 'dep2')

    refs.invalidateRef('dep1')

    console.log(refs);

    expect(refs.getLinkedRefs('target2')).toStrictEqual(['dep2'])
  })
})
