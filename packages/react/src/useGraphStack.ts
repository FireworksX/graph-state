import { useCallback, useRef } from 'react'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
import type { Entity, GraphState, ResolveOptions, SubscribeOptions } from '@graph-state/core'
import { keyOfEntity } from '@graph-state/core'
import { defaultSelector } from './shared'

interface GraphStackOptions extends ResolveOptions, SubscribeOptions {
  pause?: boolean
}

export const useGraphStack = <TState extends unknown[]>(
  graphState: GraphState,
  fields: Entity[],
  options?: GraphStackOptions
): TState => {
  const getValues = (fields: Entity[]) => fields.map(field => graphState.resolve(field, options)).filter(Boolean)

  const fieldKey = fields.map(field => keyOfEntity(field) || field).join()
  const nextValues = useRef<TState>(getValues(fields) as any as TState)
  const pausedSnapshot = useRef<TState>([] as any as TState)

  const prevFieldKey = useRef(fieldKey)
  if (prevFieldKey.current !== fieldKey) {
    prevFieldKey.current = fieldKey
    nextValues.current = getValues(fields) as any as TState
  }

  const subscribe = useCallback(
    (onChange: any) => {
      if (fields) {
        const notifyAll = () => {
          nextValues.current = getValues(fields) as any as TState
          onChange()
        }

        const unsubscribeController = new AbortController()
        fields.forEach(field => {
          if (field) {
            graphState.subscribe(field!, notifyAll, { signal: unsubscribeController.signal, ...options })
          }
        })

        return () => unsubscribeController.abort('unsubscribe')
      }

      return () => undefined
    },
    [graphState, fieldKey]
  )

  const get = () => (options?.pause ? pausedSnapshot.current : nextValues.current)

  return useSyncExternalStoreWithSelector(subscribe, get, get, defaultSelector)
}
