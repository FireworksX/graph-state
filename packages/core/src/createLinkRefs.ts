export const createLinkRefs = () => {
  const parentRefs = new Map<string, string[]>()
  const childrenRefs = new Map<string, string[]>()

  /**
   * When change depKey we need update targetKey
   */
  const addRefs = (targetKey: string, depKey: string) => {
    const prevParents = (parentRefs.get(targetKey) || []).filter(dep => dep !== depKey)
    parentRefs.set(targetKey, [...prevParents, depKey])

    const prevChildren = (childrenRefs.get(depKey) || []).filter(dep => dep !== depKey)
    childrenRefs.set(depKey, [...prevChildren, targetKey])
  }

  const getLinkedRefs = (key: string, stack: string[] = []) => {
    const deps = parentRefs.get(key) || []
    stack.push(...deps)

    const deepDeps = deps.map(ref => getLinkedRefs(ref, stack)).flat()
    stack.push(...deepDeps)

    return Array.from(new Set(stack).values())
  }

  const invalidateRef = (key: string) => {
    // parentRefs.delete(key)
    const parents = parentRefs.get(key) ?? []

    parents.forEach(parentKey => {
      childrenRefs.set(parentKey, childrenRefs.get(parentKey)?.filter?.(link => link !== key) ?? [])
    })

    // childrenRefs.set(key, childrenRefs.get(key))

    parentRefs.delete(key)
  }

  return {
    parentRefs,
    childrenRefs,
    addRefs,
    getChildren: (key: string) => childrenRefs.get(key),
    getParents: (key: string) => parentRefs.get(key),
    getLinkedRefs,
    invalidateRef,
  }
}
