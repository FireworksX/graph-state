import type { FC, ReactElement } from 'react'
import type { DataSetter, Dispatch, Entity, GraphState } from '@graph-state/core'
import { useGraph } from './useGraph'

interface GraphValueProps {
  children?: (value?: unknown, setValue?: Dispatch<DataSetter<unknown>>) => ReactElement
  graphState?: GraphState
  field?: Entity
}

export const GraphValue: FC<GraphValueProps> = ({ graphState, field, children }) => {
  if (!graphState) {
    throw new Error('Cannot find graphState.')
  }
  const value = useGraph(graphState, field || '') || field

  if (children) {
    return children(...value)
  }

  return <>{value}</>
}
