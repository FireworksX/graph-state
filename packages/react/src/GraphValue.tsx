import type { ReactElement } from 'react'
import type {
  DispatchWithOptions,
  Entity,
  GraphState,
  ResolveOptions,
  StateDataSetter,
  GetStateEntity,
} from '@graph-state/core'
import { useGraph } from './useGraph'
import type { StateResolve } from './types'

interface GraphValueProps<TState extends GraphState, TInput extends Entity> {
  children?: (
    value?: StateResolve<TState, TInput>,
    setValue?: DispatchWithOptions<StateDataSetter<GetStateEntity<TState>, TInput>>
  ) => ReactElement
  graphState?: TState
  field?: TInput
  options?: ResolveOptions
}

export const GraphValue = <TState extends GraphState, TInput extends Entity>({
  graphState,
  field,
  children,
  options,
}: GraphValueProps<TState, TInput>) => {
  if (!graphState) {
    throw new Error('Cannot find graphState.')
  }
  const value = useGraph(graphState, field, options) || field

  if (typeof children === 'function') {
    return children(...(value as any))
  }

  return <>{children}</>
}
