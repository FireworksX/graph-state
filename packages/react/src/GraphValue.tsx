import type { ReactElement } from 'react'
import type { Dispatch, Entity, GraphState, StateDataSetter } from '@graph-state/core'
import type { StateResolve } from './useGraph'
import { useGraph } from './useGraph'

interface GraphValueProps<TState extends GraphState, TInput extends Entity> {
  children?: (
    value?: StateResolve<TState, TInput>,
    setValue?: Dispatch<StateDataSetter<TState, TInput>>
  ) => ReactElement
  graphState?: TState
  field?: TInput
}

export const GraphValue = <TState extends GraphState, TInput extends Entity>({
  graphState,
  field,
  children,
}: GraphValueProps<TState, TInput>) => {
  if (!graphState) {
    throw new Error('Cannot find graphState.')
  }
  const value = useGraph(graphState, field) || field

  if (typeof children === 'function') {
    return children(...(value as any))
  }

  return <>{children}</>
}
