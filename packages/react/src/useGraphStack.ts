import { useCallback, useRef } from 'react'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
import type { Entity, GraphState } from '@graph-state/core'

const defaultSelector = (data: any) => data

export const useGraphStack = <TState extends unknown[]>(graphState: GraphState, fields: Entity[]): TState => {
  const getValues = useCallback(
    (fields: Entity[]) => fields.map(field => graphState.resolve(field)).filter(Boolean),
    []
  )
  const nextValues = useRef<TState>(getValues(fields) as any as TState)

  const subscribe = useCallback(
    (onChange: any) => {
      if (fields) {
        const notifyAll = () => {
          nextValues.current = getValues(fields) as any as TState
          onChange()
        }

        const unSubscribers = fields.filter(Boolean).map(field => graphState.subscribe(field!, notifyAll))
        if (unSubscribers.length > 0) {
          notifyAll()
        }

        return () => unSubscribers.forEach(cb => cb())
      }

      return () => undefined
    },
    [graphState, fields]
  )

  const get = () => nextValues.current

  return useSyncExternalStoreWithSelector(subscribe, get, get, defaultSelector)
}
