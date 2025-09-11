import { useCallback, useRef } from 'react'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
import type { Entity, GetReferencesOptions, GraphState, SubscribeOptions } from '@graph-state/core'

interface GraphOptions extends GetReferencesOptions, SubscribeOptions {}

const defaultSelector = (data: any) => data

export const useGraphReferences = <TState extends GraphState, const TEntity extends Entity>(
  graphState: TState,
  field: TEntity,
  options?: GraphOptions
): string[] => {
  const fieldKey = graphState?.keyOfEntity?.(field) ?? field

  const nextValue = useRef(graphState?.getReferences?.(field, options))

  const subscribe = useCallback(
    (onChange: any) => {
      if (fieldKey) {
        nextValue.current = graphState?.getReferences?.(field, options)
        onChange()

        return graphState?.subscribe?.(
          fieldKey,
          () => {
            nextValue.current = graphState?.getReferences?.(field, options)
            return onChange()
          },
          options
        )
      }

      return () => undefined
    },
    [graphState, fieldKey]
  )

  const get = () => nextValue.current

  return useSyncExternalStoreWithSelector(subscribe, get, get, defaultSelector)
}
