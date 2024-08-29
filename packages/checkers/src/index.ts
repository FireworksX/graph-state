import type { Graph } from '@graph-state/core'
import { isGraph, isLinkKey } from '@graph-state/core'

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
  if (isLinkKey(input)) return type === (input as string).split(':').at(0)
  if (isGraph(input)) return (input as Graph)._type === type

  return false
}
