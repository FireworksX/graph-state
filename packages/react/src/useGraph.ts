import { useCallback, useRef } from 'react'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
import type {
  ResolveOptions,
  Dispatch,
  Entity,
  GraphState,
  GetStateEntity,
  StateDataSetter,
  SubscribeOptions,
  MutateOptions,
} from '@graph-state/core'
import type { StateResolve } from './types'
import { keyOfEntity } from '@graph-state/core'

interface GraphOptions extends ResolveOptions, SubscribeOptions {
  pause?: boolean
}

const defaultSelector = (data: any) => data

export const useGraph = <TState extends GraphState, const TEntity extends Entity>(
  graphState: TState,
  field: TEntity,
  options?: GraphOptions
): [StateResolve<TState, TEntity>, Dispatch<StateDataSetter<GetStateEntity<TState>, TEntity>>] => {
  const nextValue = useRef<StateResolve<TState, TEntity>>(
    graphState?.resolve?.(field, options) as any as StateResolve<TState, TEntity>
  )
  const fieldKey = graphState?.keyOfEntity?.(field) ?? field

  const subscribe = useCallback(
    (onChange: any) => {
      if (fieldKey) {
        nextValue.current = graphState?.resolve?.(fieldKey, options) as any as StateResolve<TState, TEntity>
        onChange()

        return graphState?.subscribe?.(
          fieldKey,
          () => {
            nextValue.current = graphState?.resolve?.(fieldKey, options) as any as StateResolve<TState, TEntity>
            return onChange()
          },
          options
        )
      }

      return () => undefined
    },
    [graphState, fieldKey]
  )

  const updateState = useCallback(
    (value, mutateOptions?: MutateOptions) => {
      const key: any = typeof field === 'string' ? field : keyOfEntity(field)

      if (field && key) {
        graphState.mutate(key, value, mutateOptions)
      }
    },
    [graphState, field]
  )

  const get = () => (options?.pause ? null : nextValue.current)

  return [useSyncExternalStoreWithSelector(subscribe, get, get, defaultSelector), updateState]
}
