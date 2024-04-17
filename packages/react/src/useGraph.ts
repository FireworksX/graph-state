import { useCallback, useRef } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store'
import { Field, GraphState } from '@graph-state/core'


export const useGraph = <TState = any, TSelector = any>(
  graphState: GraphState,
  field: Field,
): TSelector => {
  const nextValue = useRef<TState>(graphState.resolve(field) as any as TState)


  const subscribe = useCallback(
    onChange => {
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
