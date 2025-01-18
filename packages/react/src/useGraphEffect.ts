import type { Entity, GraphState } from '@graph-state/core'
import { useEffect } from 'react'
import type { StateResolve } from './types'

export const useGraphEffect = <TState extends GraphState, const TEntity extends Entity>(
  graphState: TState,
  field: TEntity,
  cb: (nextValue: StateResolve<TState, TEntity>, prevValue: StateResolve<TState, TEntity>) => void
) => {
  const fieldKey = graphState.keyOfEntity(field) ?? field

  useEffect(() => {
    if (!fieldKey) return

    const unsubscribe = graphState.subscribe(fieldKey, (next: any, prev: any) => {
      cb(next, prev)
    })

    return () => {
      unsubscribe()
    }
  }, [fieldKey])
}
