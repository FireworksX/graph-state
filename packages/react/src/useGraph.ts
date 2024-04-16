import { useCallback, useRef } from 'react'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
import { Field, GraphState } from '@graph-state/core'

const defaultSelector = (data: any) => data

export const useGraph = <TState = any, TSelector = any>(
  graphState: GraphState,
  field: Field,
  selector: (data: TState) => TSelector = defaultSelector
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

  return useSyncExternalStoreWithSelector(subscribe, get, get, selector)
}
