import type { LinkKey } from 'src'
import { isLinkKey } from 'src'

export const isPartialKey = (key?: LinkKey | null) => key && key.split('.').length > 1

export const isPartOfGraph = (entityKey?: LinkKey | null, graphKey?: LinkKey | null) => {
  if (!entityKey || !graphKey) return false
  if (typeof entityKey !== 'string' || typeof graphKey !== 'string') return null
  const [entityType, entityId] = entityKey.split(':')
  const [graphType, graphId] = graphKey.split(':')
  if (entityType !== graphType) return false

  return entityId.startsWith(graphId)
}

export const getGraphLink = (input?: LinkKey) => {
  if (isLinkKey(input)) {
    if (isPartialKey(input)) {
      return input.split('.')[0]
    }
  }

  return input
}
