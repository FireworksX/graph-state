import { createLinkRefs } from './createLinkRefs'

describe('CreateLinkRefs', () => {
  const linkRefs = createLinkRefs()

  it('should add new ref', () => {
    linkRefs.addRefs('target', 'one')
    expect(linkRefs.getRef('target')).toStrictEqual(['one'])
  })

  it('should push new ref', () => {
    linkRefs.addRefs('target', 'two')
    expect(linkRefs.getRef('target')).toStrictEqual(['one', 'two'])
  })

  it('should skip duplicates while adding new', () => {
    linkRefs.addRefs('target', 'two')
    expect(linkRefs.getRef('target')).toStrictEqual(['one', 'two'])
  })

  it('should add linked ref', () => {
    linkRefs.addRefs('target2', 'target')
    expect(linkRefs.getRef('target2')).toStrictEqual(['target'])
  })

  it('should return all refs by key', () => {
    expect(linkRefs.getLinkedRefs('target2')).toStrictEqual(['target', 'one', 'two'])
  })

  it('should invalidate depend links', () => {
    const refs = createLinkRefs()

    refs.addRefs('target', 'dep1')
    refs.addRefs('target', 'dep2')

    refs.invalidateRef('dep1')

    console.log(refs, refs.getRef('target'))
    // expect(linkRefs.getLinkedRefs('target2')).toStrictEqual(['target', 'one', 'two'])
  })
})
