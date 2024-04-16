export const createLinkRefs = () => {
  const parentRefs = new Map<string, string[]>()
  const childrenRefs = new Map<string, string[]>()

  const addRefs = (targetKey: string, depKey: string) => {
    if (parentRefs.has(targetKey)) {
      const prevDeps = (parentRefs.get(targetKey) || []).filter(dep => dep !== depKey)
      parentRefs.set(targetKey, [...prevDeps, depKey])
    } else {
      parentRefs.set(targetKey, [depKey])
    }
    if (childrenRefs.has(targetKey)) {
      const prevDeps = (childrenRefs.get(targetKey) || []).filter(dep => dep !== targetKey)
      childrenRefs.set(depKey, [...prevDeps, targetKey])
    } else {
      childrenRefs.set(depKey, [targetKey])
    }
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
      childrenRefs.set(
        parentKey,
        childrenRefs.get(parentKey).filter(link => link !== key)
      )
    })
    parentRefs.delete(key)
  }

  return {
    parentRefs,
    childrenRefs,
    addRefs,
    getChildren: (key: string) => childrenRefs.get(key),
    getParents: (key: string) => parentRefs.get(key),
    getLinkedRefs,
    invalidateRef
  }
}
