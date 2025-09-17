import type { DebugCallback } from './debug'

export type Type = string

export interface SystemFields {
  _type: Type
  id?: string | number | null
  _id?: string | number | null
}

export interface DataFields {
  [fieldName: string]: DataField
}

export type Graph = SystemFields & DataFields

export type DataField = Scalar | Graph | undefined | Scalar[] | Graph[]

export type Entity = undefined | null | Graph | string

export type LinkKey = string

export interface ScalarObject {
  constructor?: Function
  [key: string]: any
}

export type Scalar = Primitive | ScalarObject
export type Primitive = null | number | boolean | string
export type KeyGenerator = (data: Graph) => string | null
export type ResolverResult = DataField | (DataFields & { __typename?: string }) | null | undefined
export type ResolveInfo = unknown

export type Resolver<TParent = Graph, TResult = ResolverResult> = (
  parent: TParent,
  state: GraphState,
  info: ResolveInfo
) => TResult

export interface KeyingConfig {
  [typename: string]: KeyGenerator
}

export type ResolverConfig = {
  [typeName: string]:
    | {
        [fieldName: string]: Resolver | undefined
      }
    | undefined
}

export type AnyObject = Record<PropertyKey, unknown>

export type DataSetter<T = any> = T | ((prev: T) => T)

export type Dispatch<T> = (value: T) => void

export type MutateField = (
  graph: Graph | Graph[] | null,
  parentFieldKey?: LinkKey,
  options?: MutateOptions
) => (LinkKey | LinkKey[] | null | null[])[] | LinkKey

export interface NotifyInternal {
  depth?: number
}

export interface MutateInternal {
  hasChange?: boolean
  path: string[]
  unlinks?: Map<LinkKey, LinkKey[]>
  visitors: Map<LinkKey, LinkKey[]>
  isPartialGraph?: boolean
}

export interface MutateOptions {
  replace?: true | 'deep' | ((graph: Graph) => boolean)
  overrideMutateMethod?: GraphState['mutate']
  parent?: Entity
  prevValue?: unknown
  dedup?: boolean
  internal?: MutateInternal
}

export interface SubscribeOptions<TEntity extends SystemFields = any, TInput extends Entity = any, TSelector = any> {
  signal?: AbortSignal
  selector?: (graph: ResolveEntityByType<TEntity, TInput>) => TSelector
  directChangesOnly?: boolean
}

export type Plugin = <TState extends GraphState>(state: TState) => TState | void

export type SkipGraphPredictor = (dataField: DataField) => boolean

export type CacheListener = (link: LinkKey, prevValue?: Graph | null) => void

export interface CreateStateOptions<TEntity extends SystemFields = SystemFields, TType extends LinkKey = LinkKey> {
  _type?: TType
  _id?: string
  initialState?: Omit<ResolveEntityByType<TEntity, { _type: TType }>, keyof SystemFields>
  plugins?: Plugin[]
  keys?: KeyingConfig
  resolvers?: ResolverConfig
  skip?: SkipGraphPredictor[]
}

export interface ResolveOptions<TEntity extends SystemFields = any, TInput extends Entity = any, TSelector = any> {
  deep?: boolean
  safe?: boolean
  keepLinks?: boolean
  selector?: (graph: ResolveEntityByType<TEntity, TInput>) => TSelector
}

export interface GetReferencesOptions {
  withPartialKeys?: boolean
}

type NeverToUnknown<T> = [T] extends [never] ? unknown : T

type ExtractByType<TEntity extends SystemFields, TType extends string> = TEntity extends { _type: TType }
  ? TEntity
  : TEntity extends Record<any, any>
    ? {
        [Key in keyof TEntity]: TEntity[Key] extends SystemFields ? ExtractByType<TEntity[Key], TType> : never
      }[keyof TEntity]
    : never

export type ResolveEntityByType<
  TEntity extends SystemFields,
  TInput extends Entity,
> = TInput extends `${infer TType}:${string}`
  ? NeverToUnknown<ExtractByType<TEntity, TType>>
  : TInput extends SystemFields
    ? NeverToUnknown<ExtractByType<TEntity, TInput['_type']>>
    : unknown

export type GetStateEntity<T> = T extends GraphState<infer TEntity> ? TEntity : never

export type GetStateEntityType<T> = GetStateEntity<T>['_type']

export type StateDataSetter<TEntity extends SystemFields, TInput extends Entity> = DataSetter<
  Partial<Omit<ResolveEntityByType<TEntity, TInput>, keyof SystemFields>>
>

export type SubscribeCallback = {
  callback: (nextValue: Graph | null, prevValue?: Graph | null) => void
  options?: {
    selector?: <TEntity extends SystemFields = any, TInput extends Entity = any, TSelector = any>(
      graph: ResolveEntityByType<TEntity, TInput>
    ) => TSelector
    directChangesOnly?: boolean
  }
}

export interface GraphState<TEntity extends SystemFields = SystemFields, TRootType extends LinkKey = LinkKey>
  extends Graph {
  _type: TRootType
  key: `${TRootType}:${string}`
  getReferences<const TInput extends Entity | null>(entity: TInput, options?: GetReferencesOptions): string[]
  resolve<const TInput extends Entity, TSelector>(
    input: TInput,
    options?: ResolveOptions<TEntity, TInput, TSelector>
  ): TSelector extends AnyObject ? TSelector : ResolveEntityByType<TEntity, TInput> | null
  mutate<const TInput extends Graph | null>(
    graph: TInput & Partial<ResolveEntityByType<TEntity, TInput>>,
    options?: MutateOptions
  ): string | null
  mutate<TInput extends string>(
    key: TInput,
    data: StateDataSetter<TEntity, TInput>,
    options?: MutateOptions
  ): string | null
  invalidate(field: Entity): void
  subscribe<TData = unknown>(callback: (data: TData) => void, options?: SubscribeOptions): () => void
  subscribe<TInput extends Graph | string, TResult extends ResolveEntityByType<TEntity, TInput>, TSelector>(
    input: TInput,
    callback: (next: TResult, prev: TResult) => void,
    options?: SubscribeOptions<TEntity, TInput, TSelector>
  ): () => void
  inspectFields(type: string): string[]
  resolveParents(field: Entity): unknown[]
  keyOfEntity(entity: Entity): LinkKey | null
  entityOfKey(key: LinkKey): Graph | null
  use(plugin: Plugin): void
  addSkip(predictor: SkipGraphPredictor): void
  getArgumentsForMutate(
    field: string | Graph,
    args: Parameters<GraphState<TEntity>['mutate']>
  ): {
    graphKey: string | null
    options?: MutateOptions
    data: DataSetter
  }
  onDebugEvent(callback: DebugCallback): void
  types: Map<Type, Set<LinkKey>>
}
