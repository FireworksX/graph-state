import { useCallback, useRef } from 'react'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
import type { Entity, GetReferencesOptions, GraphState, SubscribeOptions } from '@graph-state/core'
import { keyOfEntity } from '@graph-state/core'
import { defaultSelector } from './shared'

interface GraphOptions extends GetReferencesOptions, SubscribeOptions {}

export const useGraphReferences = <TState extends GraphState, const TEntity extends Entity>(
  graphState: TState,
  field: TEntity,
  options?: GraphOptions
): string[] => {
  const fieldKey = keyOfEntity(field) ?? field

  const nextValue = useRef(graphState?.getReferences?.(field, options))

  const prevFieldKey = useRef(fieldKey)
  if (prevFieldKey.current !== fieldKey) {
    prevFieldKey.current = fieldKey
    nextValue.current = graphState?.getReferences?.(field, options)
  }

  const subscribe = useCallback(
    (onChange: any) => {
      if (fieldKey) {
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
