import { useCallback, useRef } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store'
import type { Entity, GraphState } from '@graph-state/core'

export const useGraph = <TState = any>(graphState: GraphState, field: Entity): TState => {
  const nextValue = useRef<TState>(graphState.resolve(field) as any as TState)

  const subscribe = useCallback(
    (onChange: any) => {
      if (field) {
        nextValue.current = graphState.resolve(field) as any as TState
        onChange()

        return graphState.subscribe(field, (data: any) => {
          nextValue.current = data
          return onChange()
        })
      }

      return () => undefined
    },
    [graphState, field]
  )

  const get = () => nextValue.current

  return useSyncExternalStore(subscribe, get, get)
}
