import type { FC, ReactElement } from 'react'
import type { DataSetter, Dispatch, Entity, Graph, GraphState } from '@graph-state/core'
import { useGraph } from './useGraph'

interface GraphValueProps<TEntities extends Graph[]> {
  children?: (value?: unknown, setValue?: Dispatch<DataSetter<unknown>>) => ReactElement
  graphState?: GraphState<TEntities>
  field?: Entity
}

export const GraphValue: FC<GraphValueProps<any>> = ({ graphState, field, children }) => {
  if (!graphState) {
    throw new Error('Cannot find graphState.')
  }
  const value = useGraph(graphState, field) || field

  if (typeof children === 'function') {
    return children(...value)
  }

  return <>{children}</>
}
