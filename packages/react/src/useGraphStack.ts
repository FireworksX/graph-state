import { useCallback, useMemo, useRef } from 'react'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
import type { Entity, GraphState, ResolveOptions, SubscribeOptions } from '@graph-state/core'

const defaultSelector = (data: any) => data

interface GraphStackOptions extends ResolveOptions, SubscribeOptions {}

export const useGraphStack = <TState extends unknown[]>(
  graphState: GraphState,
  fields: Entity[],
  options?: GraphStackOptions
): TState => {
  const getValues = useCallback(
    (fields: Entity[]) => fields.map(field => graphState.resolve(field, options)).filter(Boolean),
    [graphState, options]
  )

  const fieldKey = useMemo(() => fields.map(field => graphState.keyOfEntity(field) || field).join(), [fields])
  const nextValues = useRef<TState>(getValues(fields) as any as TState)

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

        notifyAll()

        return () => unsubscribeController.abort('unsubscribe')
      }

      return () => undefined
    },
    [graphState, fieldKey]
  )

  const get = () => nextValues.current

  return useSyncExternalStoreWithSelector(subscribe, get, get, defaultSelector)
}
