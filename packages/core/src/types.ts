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

export type AnyObject = Record<string, unknown>

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
}

export type Plugin = (state: GraphState) => GraphState

export interface CreateStateOptions {
  id?: string
  initialState?: Graph
  plugins?: Plugin[]
  keys?: KeyingConfig
  resolvers?: ResolverConfig
}

export interface GraphState extends Graph {
  resolve(input: Entity): unknown | null
  mutate<TInput extends Graph | null>(graph: TInput, options?: SetOptions): string | null
  mutate<TInput extends string>(key: TInput, data: DataSetter, options?: SetOptions): string | null
  invalidate(field: Entity): void
  subscribe<TInput extends Graph | string>(input: TInput, callback: (data: any) => void): () => void
  inspectFields(type: string): string[]
  resolveParents(field: Entity): unknown[]
  keyOfEntity(entity: Entity): LinkKey | null
  entityOfKey(key: LinkKey): Entity | null
  getArgumentsForMutate(
    field: string | Graph,
    args: Parameters<GraphState['mutate']>
  ): {
    graphKey: string | null
    options?: SetOptions
    data: DataSetter
  }
}
