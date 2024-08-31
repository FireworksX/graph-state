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

// <TEntities extends Graph[]>
export type Resolver<TEntities extends Graph[], TParent = Graph, TResult = ResolverResult> = (
  parent: TParent,
  state: GraphState<TEntities>,
  info: ResolveInfo
) => TResult

export interface KeyingConfig {
  [typename: string]: KeyGenerator
}

export type ResolverConfig<TEntities extends Graph[]> = {
  [typeName: string]:
    | {
        [fieldName: string]: Resolver<TEntities> | undefined
      }
    | undefined
}

export type AnyObject = Record<string, unknown>

export type DataSetter<T = any> = T | ((prev: T) => T)

export type Dispatch<T> = (value: T) => void

export type MutateField<TEntities extends Graph[]> = (
  graph: Graph | Graph[] | null,
  parentFieldKey?: LinkKey,
  options?: SetOptions<TEntities>
) => (LinkKey | LinkKey[] | null | null[])[] | LinkKey

export interface SetOptions<TEntities extends Graph[]> {
  replace?: boolean
  overrideMutateMethod?: GraphState<TEntities>['mutate']
  parent?: Entity
  dedup?: boolean
  internal?: {
    hasChange?: boolean
  }
}

export type Plugin = <TEntities extends Graph[]>(state: GraphState<TEntities>) => GraphState<TEntities>

export interface CreateStateOptions<TEntity extends Graph, TEntities extends Graph[]> {
  id?: string
  initialState?: TEntity | Omit<TEntity, '_type' | 'id' | '_id'>
  plugins?: Plugin[]
  keys?: KeyingConfig
  resolvers?: ResolverConfig<TEntities>
}

export interface GraphState<TEntities extends Graph[]> extends Graph {
  key: LinkKey
  resolve<K extends TEntities[number]['_type']>(
    input?: `${K}:${string}` | Extract<TEntities[number], { _type: K }> | null | undefined
  ): Extract<TEntities[number], { _type: K }> | null | undefined
  mutate<TInput extends Graph | null>(graph: TInput, options?: SetOptions<TEntities>): string | null
  mutate<TInput extends string>(key: TInput, data: DataSetter, options?: SetOptions<TEntities>): string | null
  invalidate(field: Entity): void
  subscribe(callback: (data: any) => void): () => void
  subscribe<TInput extends Graph | string>(input: TInput, callback: (data: any) => void): () => void
  inspectFields(type: string): string[]
  resolveParents(field: Entity): unknown[]
  keyOfEntity(entity: Entity): LinkKey | null
  entityOfKey(key: LinkKey): Graph | null
  getArgumentsForMutate(
    field: string | Graph,
    args: Parameters<GraphState<TEntities>['mutate']>
  ): {
    graphKey: string | null
    options?: SetOptions<TEntities>
    data: DataSetter
  }
  types: Map<Type, Set<LinkKey>>
}
