import { useCallback, useRef } from 'react'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
import type {
  ResolveOptions,
  Entity,
  GraphState,
  GetStateEntity,
  StateDataSetter,
  SubscribeOptions,
  MutateOptions,
  DispatchWithOptions,
} from '@graph-state/core'
import type { StateResolve } from './types'
import { keyOfEntity } from '@graph-state/core'
import { defaultSelector } from './shared'

interface GraphOptions extends ResolveOptions, SubscribeOptions {
  pause?: boolean
}

export const useGraph = <TState extends GraphState, const TEntity extends Entity>(
  graphState: TState,
  field: TEntity,
  options?: GraphOptions
): [StateResolve<TState, TEntity>, DispatchWithOptions<StateDataSetter<GetStateEntity<TState>, TEntity>>] => {
  const nextValue = useRef<StateResolve<TState, TEntity>>(
    graphState?.resolve?.(field, options) as any as StateResolve<TState, TEntity>
  )
  const fieldKey = keyOfEntity(field) ?? field

  const prevFieldKey = useRef(fieldKey)
  if (prevFieldKey.current !== fieldKey) {
    prevFieldKey.current = fieldKey
    nextValue.current = graphState?.resolve?.(field, options) as any as StateResolve<TState, TEntity>
  }

  const subscribe = useCallback(
    (onChange: any) => {
      if (fieldKey) {
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
