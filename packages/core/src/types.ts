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
  options?: SetOptions
) => (LinkKey | LinkKey[] | null | null[])[] | LinkKey

export interface SetOptions {
  replace?: boolean
  overrideMutateMethod?: GraphState['mutate']
  parent?: Entity
  dedup?: boolean
  internal?: {
    hasChange?: boolean
  }
}

export type PluginDeclareOverride = (overrider: PluginOverrider) => void

export interface PluginOverrides {
  overrideMutate: PluginDeclareOverride
}

export type Plugin = <TState extends GraphState>(state: TState, overrides: PluginOverrides) => TState | void
export type PluginOverrider = <TState extends GraphState>(
  next: TState['mutate'],
  ...args: Parameters<TState['mutate']>
) => TState | void
export type SkipGraphPredictor = (dataField: DataField) => boolean

export interface CreateStateOptions<TEntity extends SystemFields = SystemFields, TType extends LinkKey = LinkKey> {
  type?: TType
  id?: string
  initialState?: Omit<ResolveEntityByType<TEntity, { _type: TType }>, keyof SystemFields>
  plugins?: Plugin[]
  keys?: KeyingConfig
  resolvers?: ResolverConfig
  skip?: SkipGraphPredictor[]
}

export interface ResolveOptions {
  deep?: boolean
  safe?: boolean
}

type NeverToUnknown<T> = [T] extends [never] ? unknown : T

export type ResolveEntityByType<
  TEntity extends SystemFields,
  TInput extends Entity,
> = TInput extends `${infer TType}:${string}`
  ? NeverToUnknown<Extract<TEntity, { _type: TType }>>
  : TInput extends SystemFields
    ? NeverToUnknown<Extract<TEntity, { _type: TInput['_type'] }>>
    : unknown

export type GetStateEntity<T> = T extends GraphState<infer TEntity> ? TEntity : never

export type GetStateEntityType<T> = GetStateEntity<T>['_type']

export type StateDataSetter<TEntity extends SystemFields, TInput extends Entity> = DataSetter<
  Partial<Omit<ResolveEntityByType<TEntity, TInput>, keyof SystemFields>>
>

export interface GraphState<TEntity extends SystemFields = SystemFields, TRootType extends LinkKey = LinkKey>
  extends Graph {
  _type: TRootType
  key: `${TRootType}:${string}`
  resolve<const TInput extends Entity>(
    input: TInput,
    options?: ResolveOptions
  ): ResolveEntityByType<TEntity, TInput> | null
  mutate<const TInput extends Graph | null>(
    graph: TInput & Partial<ResolveEntityByType<TEntity, TInput>>,
    options?: SetOptions
  ): string | null
  mutate<TInput extends string>(
    key: TInput,
    data: StateDataSetter<TEntity, TInput>,
    options?: SetOptions
  ): string | null
  invalidate(field: Entity): void
  subscribe<TData = unknown>(callback: (data: TData) => void): () => void
  subscribe<TInput extends Graph | string>(
    input: TInput,
    callback: (data: ResolveEntityByType<TEntity, TInput>) => void
  ): () => void
  inspectFields(type: string): string[]
  resolveParents(field: Entity): unknown[]
  keyOfEntity(entity: Entity): LinkKey | null
  entityOfKey(key: LinkKey): Graph | null
  getArgumentsForMutate(
    field: string | Graph,
    args: Parameters<GraphState<TEntity>['mutate']>
  ): {
    graphKey: string | null
    options?: SetOptions
    data: DataSetter
  }
  types: Map<Type, Set<LinkKey>>
}
