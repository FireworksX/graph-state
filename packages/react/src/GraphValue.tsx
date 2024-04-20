import type { FC, ReactElement } from 'react'
import type { Field, GraphState } from '@graph-state/core'
import { useGraph } from './useGraph'

interface GraphValueProps {
  children?: (value?: unknown) => ReactElement
  graphState?: GraphState
  field?: Field
}

export const GraphValue: FC<GraphValueProps> = ({ graphState, field, children }) => {
  if (!graphState) {
    throw new Error('Cannot find statex.')
  }
  const value = useGraph(graphState, field || '') || field

  if (children) {
    return children(value)
  }

  return <>{value}</>
}
