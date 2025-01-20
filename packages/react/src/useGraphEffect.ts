import type { Entity, GraphState } from '@graph-state/core'
import { useEffect } from 'react'
import type { StateResolve } from './types'

export const useGraphEffect = <TState extends GraphState, const TEntity extends Entity>(
  graphState?: TState | null,
  field?: TEntity | null,
  cb?: ((nextValue: StateResolve<TState, TEntity>, prevValue: StateResolve<TState, TEntity>) => void) | null
) => {
  const fieldKey = graphState?.keyOfEntity?.(field) ?? field

  useEffect(() => {
    if (!fieldKey || !cb || !graphState) return

    const unsubscribe = graphState.subscribe(fieldKey, (next: any, prev: any) => {
      cb(next, prev)
    })

    return () => {
      unsubscribe()
    }
  }, [fieldKey, graphState])
}
