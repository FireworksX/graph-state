export const isEmptyValue = (value: unknown): value is null | undefined =>
  !value && (value === null || value === undefined)

export const isValue = <T>(value: T): value is Exclude<T, null | undefined> => !isEmptyValue(value)

export const isObject = (value: unknown): value is object =>
  typeof value === 'object' && !Array.isArray(value) && isValue(value)

export const isHTMLNode = (o: any) => {
  return typeof Node === 'object'
    ? o instanceof Node
    : o && typeof o === 'object' && typeof o.nodeType === 'number' && typeof o.nodeName === 'string'
}
