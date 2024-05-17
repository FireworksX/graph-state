import { unique } from './utils/unique'
import type { LinkKey, Graph, Type } from './types'
import { isPartialKey } from './utils/isPartOfGraph'

export const createCache = () => {
  const types = new Map<Type, Set<LinkKey>>()
  const links = new Map<LinkKey, Graph>()
  const parentRefs = new Map<LinkKey, LinkKey[]>()
  const childrenRefs = new Map<LinkKey, LinkKey[]>()
  const refCount = new Map<LinkKey, number>()
  const gbLinks = new Set<LinkKey>([])

  /**
   * When change depKey we need update targetKey
   */
  const addRefs = (targetKey: string, depKey: string) => {
    parentRefs.set(targetKey, unique(...(parentRefs.get(targetKey) || []), depKey))
    childrenRefs.set(depKey, unique(...(childrenRefs.get(depKey) ?? []), targetKey))
    updateRefCountForLink(targetKey, parentRefs.get(targetKey)?.length || 0)
  }

  const getLinkedRefs = (key: string, stack: string[] = []) => {
    const deps = parentRefs.get(key) || []
    stack.push(...deps)

    const deepDeps = deps.map(ref => getLinkedRefs(ref, stack)).flat()
    stack.push(...deepDeps)

    return Array.from(new Set(stack).values())
  }

  const invalidate = (key: string) => {
    updateRefCountForLink(key, 0)
    garbageCollector()
  }

  const readLink = (key: string | null | undefined) => {
    if (key) {
      return links.get(key)
    }
    return null
  }

  const writeLink = (key: string | null | undefined, value: any, depKey?: string) => {
    if (typeof key === 'string') {
      links.set(key, value)

      const [type] = key.split(':')
      if (!isPartialKey(key)) {
        if (!types.has(type)) {
          types.set(type, new Set([key]))
        } else {
          types.get(type)?.add(key)
        }
      }
    }

    if (depKey && key) {
      addRefs(key, depKey)
    }
  }

  const hasLink = (key: string | null | undefined) => {
    if (key) {
      return links.has(key)
    }
    return false
  }

  const updateRefCountForLink = (link: LinkKey | LinkKey[], count: number) => {
    if (Array.isArray(link)) {
      link.forEach((link, index) => updateRefCountForLink(link, index))
    } else {
      const prevCount = refCount.get(link)
      refCount.set(link, count)
      // Add it to the garbage collection batch if it needs to be deleted or remove it
      // from the batch if it needs to be kept
      if (!count) {
        gbLinks.add(link)
      } else if (!prevCount && count) {
        gbLinks.delete(link)
      }
    }
  }

  const getLinkEntries = () => Array.from(links.entries())

  const getRefCount = (link: LinkKey) => refCount.get(link) ?? 0

  const garbageCollector = () => {
    for (const link of gbLinks.keys()) {
      const count = getRefCount(link)
      if (count > 0) continue

      gbLinks.delete(link)
      links.delete(link)
      refCount.delete(link)
      const parents = parentRefs.get(link) ?? []
      const children = childrenRefs.get(link) ?? []

      parents.forEach(parentKey => {
        childrenRefs.set(parentKey, childrenRefs.get(parentKey)?.filter?.(childLink => childLink !== link) ?? [])
      })

      children.forEach(childKey => {
        updateRefCountForLink(childKey, getRefCount(childKey) - 1)
      })

      const [type] = link.split(':')
      if (!isPartialKey(link)) {
        types.get(type)?.delete(link)
      }

      parentRefs.delete(link)
    }
  }

  return {
    readLink,
    writeLink,
    hasLink,
    getLinkEntries,
    parentRefs,
    childrenRefs,
    addRefs,
    getChildren: (key: string) => childrenRefs.get(key),
    getParents: (key: string) => parentRefs.get(key),
    getLinkedRefs,
    invalidate,
    links,
    types,
    refCount,
    runGarbageCollector: garbageCollector,
  }
}
