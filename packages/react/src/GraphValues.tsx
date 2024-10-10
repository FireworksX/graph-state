import type { FC, ReactElement } from 'react'
import type { Entity, GraphState, ResolveOptions } from '@graph-state/core'
import { useGraphStack } from './useGraphStack'

interface GraphValueProps {
  children?: (values: unknown[]) => ReactElement
  graphState?: GraphState
  fields?: Entity[]
  options?: ResolveOptions
}

export const GraphValues: FC<GraphValueProps> = ({ graphState, fields = [], children, options }) => {
  if (!graphState) {
    throw new Error('Cannot find graphState.')
  }
  const values = useGraphStack(graphState, fields, options) ?? []

  if (typeof children === 'function') {
    return children(values)
  }

  return <>{children}</>
}
