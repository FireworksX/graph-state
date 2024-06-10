import { useCallback, useRef } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim'
import type { DataSetter, Dispatch, Entity, GraphState } from '@graph-state/core'
import type { ResolveOptions } from '@graph-state/core'

interface GraphOptions extends ResolveOptions {}

export const useGraph = <TState = any>(
  graphState: GraphState,
  field: Entity = graphState.key,
  options?: GraphOptions
): [TState, Dispatch<DataSetter<TState>>] => {
  const nextValue = useRef<TState>(graphState.resolve(field, options) as any as TState)
  const fieldKey = graphState.keyOfEntity(field) ?? field

  const subscribe = useCallback(
    (onChange: any) => {
      if (fieldKey) {
        nextValue.current = graphState.resolve(fieldKey, options) as any as TState
        onChange()

        return graphState.subscribe(fieldKey, (data: any) => {
          nextValue.current = data
          return onChange()
        })
      }

      return () => undefined
    },
    [graphState, fieldKey]
  )

  const updateState = useCallback(
    (value: DataSetter<TState>) => {
      const key = typeof field === 'string' ? field : graphState.keyOfEntity(field)

      if (field && key) {
        graphState.mutate(key, value)
      }
    },
    [graphState, field]
  )

  const get = () => nextValue.current

  return [useSyncExternalStore(subscribe, get, get), updateState]
}
