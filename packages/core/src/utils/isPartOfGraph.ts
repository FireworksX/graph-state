import type { LinkKey } from 'src'

export const isPartialKey = (key?: LinkKey | null) => key && key.split('.').length > 1

export const isPartOfGraph = (entityKey?: LinkKey | null, graphKey?: LinkKey | null) => {
  if (!entityKey || !graphKey) return false
  const [entityType, entityId] = entityKey.split(':')
  const [graphType, graphId] = graphKey.split(':')
  if (entityType !== graphType) return false

  return entityId.startsWith(graphId)
}
