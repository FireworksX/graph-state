export const isHtmlNode = (input: any) =>
  typeof Node === 'object'
    ? input instanceof Node
    : input && typeof input === 'object' && typeof input.nodeType === 'number' && typeof input.nodeName === 'string'

export const isInstanceOf = (compare: any) => (input: any) => input && input instanceof compare

export const isJsxNode = (input: any) =>
  input && typeof input.props === 'object' && input.props !== null && typeof input.type !== 'undefined'

export const isLink = (input: any) => input && typeof input === 'string' && input.split(':').length >= 2
