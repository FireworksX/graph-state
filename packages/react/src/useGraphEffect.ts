import { useEffect } from 'react'
import type { Entity, GraphState, SubscribeOptions } from '@graph-state/core'
import type { StateResolve } from './types'
import { keyOfEntity } from '@graph-state/core'

interface GraphEffectOptions extends SubscribeOptions {
  pause?: boolean
}

export function useGraphEffect<TState extends GraphState, const TEntity extends Entity>(
  graphState?: TState | null,
  field?: TEntity | null,
  cb?: ((nextValue: StateResolve<TState, TEntity>, prevValue: StateResolve<TState, TEntity>) => void) | null,
  options?: GraphEffectOptions
): void

export function useGraphEffect<TState extends GraphState, const TEntity extends Entity>(
  graphState?: TState | null,
  field?: TEntity[] | null,
  cb?:
    | ((nextValue: StateResolve<TState, TEntity>, prevValue: StateResolve<TState, TEntity>, index?: number) => void)
    | null,
  options?: GraphEffectOptions
): void

export function useGraphEffect<TState extends GraphState>(graphState?: TState | null, ...args: any[]) {
  const input = typeof args[0] === 'function' ? null : args[0]
  const options: GraphEffectOptions | undefined = typeof args[0] === 'function' ? args[1] : args[2]
  const callback = options?.pause ? null : typeof args[0] === 'function' ? args[0] : args[1]

  useEffect(() => {
    if (!callback || !graphState) return
    const controller = new AbortController()

    if (!input) {
      ;(graphState as any).subscribe(callback, {
        signal: controller.signal,
        ...options,
      })
      return () => {
        controller.abort()
      }
    }

    const isArrayField = Array.isArray(input)
    const fields = isArrayField ? input : input ? [input] : []

    fields.forEach((entity, index) => {
      const fieldKey = keyOfEntity?.(entity) ?? entity

      if (fieldKey) {
        graphState.subscribe(
          fieldKey,
          (next: any, prev: any) => {
            callback(next, prev, isArrayField ? index : undefined)
          },
          {
            signal: controller.signal,
            ...options,
          }
        )
      }
    })

    return () => {
      controller.abort()
    }
  }, [graphState, input, callback])
}
