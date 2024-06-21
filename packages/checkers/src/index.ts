export const isHtmlNode = (input: any) =>
  typeof Node === 'object'
    ? input instanceof Node
    : input && typeof input === 'object' && typeof input.nodeType === 'number' && typeof input.nodeName === 'string'

export const isInstanceOf = (compare: any) => (input: any) => input && input instanceof compare
