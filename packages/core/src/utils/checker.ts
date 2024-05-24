import type { Graph, LinkKey } from 'src'

export const isEmptyValue = (value: unknown): value is null | undefined =>
  !value && (value === null || value === undefined)

export const isValue = <T>(value: T): value is Exclude<T, null | undefined> => !isEmptyValue(value)

export const isObject = (value: unknown): value is Record<any, any> =>
  typeof value === 'object' && !Array.isArray(value) && isValue(value)

export const isHTMLNode = (o: any) => {
  return typeof Node === 'object'
    ? o instanceof Node
    : o && typeof o === 'object' && typeof o.nodeType === 'number' && typeof o.nodeName === 'string'
}

export const isGraphOrKey = (x: any): x is LinkKey | Graph => typeof x === 'string' || isGraph(x)

export const isGraph = (x: unknown): x is Graph => typeof x === 'object' && typeof (x as any)._type === 'string'

export const isPrimitive = (value: any): value is string | number | boolean =>
  (typeof value !== 'object' && typeof value !== 'function') || value === null

export const deepEqual = (a: any, b: any) => {
  if (a === b) return true
  if (!isObject(a) || !isObject(b)) return false

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!keysB.includes(key)) return false
    if (!deepEqual(a[key], b[key])) return false
  }

  return true
}
