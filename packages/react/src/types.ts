import type { Entity, GetStateEntity, GraphState, ResolveEntityByType } from '@graph-state/core'

export type StateResolve<TState extends GraphState, TEntity extends Entity> = ResolveEntityByType<
  GetStateEntity<TState>,
  TEntity
>
