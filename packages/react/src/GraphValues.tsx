import type { FC, ReactElement } from 'react'
import type { Entity, Graph, GraphState } from '@graph-state/core'
import { useGraphStack } from './useGraphStack'

interface GraphValueProps<TEntities extends Graph[]> {
  children?: (values: unknown[]) => ReactElement
  graphState?: GraphState<TEntities>
  fields?: Entity[]
}

export const GraphValues: FC<GraphValueProps<any>> = ({ graphState, fields = [], children }) => {
  if (!graphState) {
    throw new Error('Cannot find graphState.')
  }
  const values = useGraphStack(graphState, fields) ?? []

  if (typeof children === 'function') {
    return children(values)
  }

  return <>{children}</>
}
