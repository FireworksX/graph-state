import { useCallback, useRef } from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim'
import type { Graph, GraphState } from '@graph-state/core'

export const useGraphFields = (graphState: GraphState, type: Graph['_type']): string[] => {
  const nextValue = useRef<string[]>(graphState.inspectFields(type))

  const subscribe = useCallback(
    (onChange: any) => {
      if (type) {
        nextValue.current = graphState.inspectFields(type)
        onChange()

        graphState.subscribe(() => {
          const nextFields = graphState.inspectFields(type)

          if (nextFields !== nextValue.current) {
            nextValue.current = nextFields
            onChange()
          }
        })
      }

      return onChange()
    },
    [graphState, type]
  )

  const get = () => nextValue.current

  return useSyncExternalStore(subscribe, get, get)
}
