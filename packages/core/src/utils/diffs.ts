export const diffObjectKeys = (objectOne: Record<string, unknown>, objectTwo: Record<string, unknown>) => {
  const keys1 = new Set(Object.keys(objectOne ?? {}))
  const keys2 = new Set(Object.keys(objectTwo ?? {}))

  return {
    oneUniq: Array.from(keys1).filter(key => !keys2.has(key)),
    twoUniq: Array.from(keys2).filter(key => !keys1.has(key)),
  }
}
