import type { FC, ReactElement } from 'react'
import type { Entity, GraphState } from '@graph-state/core'
import { useGraphStack } from './useGraphStack'

interface GraphValueProps {
  children?: (values: unknown[]) => ReactElement
  graphState?: GraphState
  fields?: Entity[]
}

export const GraphValues: FC<GraphValueProps> = ({ graphState, fields = [], children }) => {
  if (!graphState) {
    throw new Error('Cannot find graphState.')
  }
  const values = useGraphStack(graphState, fields) ?? []

  if (typeof children === 'function') {
    return children(values)
  }

  return <>{children}</>
}
