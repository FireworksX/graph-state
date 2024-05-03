import { unique } from './utils/unique'

export const cache = () => {
  const links = new Map<string, any>()
  const parentRefs = new Map<string, string[]>()
  const childrenRefs = new Map<string, string[]>()

  /**
   * When change depKey we need update targetKey
   */
  const addRefs = (targetKey: string, depKey: string) => {
    parentRefs.set(targetKey, unique(...(parentRefs.get(targetKey) || []), depKey))
    childrenRefs.set(depKey, unique(...(childrenRefs.get(depKey) ?? []), targetKey))
  }

  const getLinkedRefs = (key: string, stack: string[] = []) => {
    const deps = parentRefs.get(key) || []
    stack.push(...deps)

    const deepDeps = deps.map(ref => getLinkedRefs(ref, stack)).flat()
    stack.push(...deepDeps)

    return Array.from(new Set(stack).values())
  }

  const invalidate = (key: string) => {
    // parentRefs.delete(key)
    links.delete(key)
    const parents = parentRefs.get(key) ?? []

    parents.forEach(parentKey => {
      childrenRefs.set(parentKey, childrenRefs.get(parentKey)?.filter?.(link => link !== key) ?? [])
    })

    // childrenRefs.set(key, childrenRefs.get(key))

    parentRefs.delete(key)
  }

  const readLink = (key: string | null | undefined) => {
    if (key) {
      return links.get(key)
    }
    return null
  }

  const writeLink = (key: string | null | undefined, value: any, depKey?: string) => {
    if (key) {
      links.set(key, value)
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

  const getLinkEntries = () => Array.from(links.entries())

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
  }
}
