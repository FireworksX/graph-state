import { useEffect } from 'react'
import type { Entity, GraphState, SubscribeOptions } from '@graph-state/core'
import type { StateResolve } from './types'

export function useGraphEffect<TState extends GraphState, const TEntity extends Entity>(
  graphState?: TState | null,
  field?: TEntity | null,
  cb?: ((nextValue: StateResolve<TState, TEntity>, prevValue: StateResolve<TState, TEntity>) => void) | null,
  options?: SubscribeOptions
): void

export function useGraphEffect<TState extends GraphState, const TEntity extends Entity>(
  graphState?: TState | null,
  field?: TEntity[] | null,
  cb?:
    | ((nextValue: StateResolve<TState, TEntity>, prevValue: StateResolve<TState, TEntity>, index?: number) => void)
    | null,
  options?: SubscribeOptions
): void

export function useGraphEffect<TState extends GraphState, const TEntity extends Entity>(
  graphState?: TState | null,
  field?: TEntity | TEntity[] | null,
  cb?:
    | ((nextValue: StateResolve<TState, TEntity>, prevValue: StateResolve<TState, TEntity>, index?: number) => void)
    | null,
  options?: SubscribeOptions
) {
  useEffect(() => {
    if (!field || !cb || !graphState) return
    const isArrayField = Array.isArray(field)
    const fields = isArrayField ? field : field ? [field] : []
    const controller = new AbortController()

    fields.forEach((entity, index) => {
      const fieldKey = graphState.keyOfEntity?.(entity) ?? entity

      if (fieldKey) {
        graphState.subscribe(
          fieldKey,
          (next: any, prev: any) => {
            cb(next, prev, isArrayField ? index : undefined)
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
  }, [graphState, field])
}
