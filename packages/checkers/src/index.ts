export const isEmptyValue = (value: unknown): value is null | undefined =>
  !value && (value === null || value === undefined)

export const isValue = <T>(value: T): value is Exclude<T, null | undefined> => !isEmptyValue(value)

export const isObject = (value: unknown): value is Record<PropertyKey, unknown> =>
  typeof value === 'object' && !Array.isArray(value) && isValue(value)

export const isHTMLNode = (o: any) => {
  return typeof Node === 'object'
    ? o instanceof Node
    : o && typeof o === 'object' && typeof o.nodeType === 'number' && typeof o.nodeName === 'string'
}

export const isGraphOrKey = (x: any): boolean => typeof x === 'string' || isGraph(x)

export const isGraph = (x: unknown) => typeof x === 'object' && typeof (x as any)._type === 'string'

export const isLinkKey = (x: unknown): boolean => typeof x === 'string' && x.split(':').length >= 2

export const isPrimitive = (value: any): value is string | number | boolean =>
  (typeof value !== 'object' && typeof value !== 'function') || value === null

export const isHtmlNode = (input: any) =>
  typeof Node === 'object'
    ? input instanceof Node
    : input && typeof input === 'object' && typeof input.nodeType === 'number' && typeof input.nodeName === 'string'

export const isInstanceOf =
  (compare: any) =>
  (input: any): boolean =>
    input && input instanceof compare

export const isJsxNode = (input: any): boolean =>
  input && typeof input.props === 'object' && input.props !== null && typeof input.type !== 'undefined'

export const isLink = (input: any): boolean => input && typeof input === 'string' && input.split(':').length >= 2

export const isHtmlContent = (input: unknown): boolean =>
  typeof input === 'string' ? /<\/?[a-z][\s\S]*>/i.test(input) : false

export const isGraphOfType = (type: string) => (input: unknown) => {
  if (isLinkKey(input)) return type === (input as string).split(':')?.[0]
  if (isGraph(input)) return (input as any)._type === type

  return false
}

export const allowTypes = (types: string[]) => (input: unknown) => {
  if (!input) return false
  let type: string | null = null
  if (isLinkKey(input)) {
    type = (input as string).split(':')?.[0]
  }

  if (isGraph(input)) {
    type = (input as any)._type
  }

  return type ? !types.includes(type) : false
}
