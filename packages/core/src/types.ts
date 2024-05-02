export interface SystemFields {
  _type: string
  id?: string | number | null
  _id?: string | number | null
}

export interface DataFields {
  [fieldName: string]: DataField
}

export type Graph = SystemFields & DataFields

export type DataField = Scalar | Graph | undefined

export type Entity = undefined | null | Graph | string

export type LinkKey = string

export interface ScalarObject {
  constructor?: Function
  [key: string]: any
}

export type Scalar = Primitive | ScalarObject

export type Primitive = null | number | boolean | string

export type FieldToEntity<TField extends Entity> = TField extends null
  ? null
  : TField extends Graph
    ? TField
    : TField extends `${infer TType}:${infer TKey}`
      ? { _type: TType; _id: TKey }
      : TField

export type Links<TInput extends Graph> = {
  [TKey in keyof TInput]: TInput[TKey] extends (infer TArrayValue)[]
    ? TArrayValue extends Graph
      ? string[]
      : TArrayValue
    : TInput[TKey] extends Record<PropertyKey, infer TObjValue>
      ? TObjValue extends Graph
        ? Record<PropertyKey, string>
        : TObjValue
      : TInput[TKey]
}

export type KeyGenerator = (data: Graph) => string | null

export interface KeyingConfig {
  [typename: string]: KeyGenerator
}

export type AnyObject = Record<string, unknown>

export type DataSetter<T = any> = T extends undefined
  ? AnyObject | ((prev: AnyObject) => AnyObject)
  : T | ((prev: T) => T)

export type Dispatch<T> = (value: T) => void

export interface SetOptions {
  replace?: boolean
  overrideMutateMethod?: GraphState['mutate']
}

export type Plugin = (state: GraphState) => GraphState

export interface CreateStateOptions {
  id?: string
  initialState?: Graph
  plugins?: Plugin[]
  keys?: KeyingConfig
}

export interface GraphState extends Graph {
  resolve(input: Entity): unknown | null
  buildLinks<TInput = unknown>(input: TInput, options: SetOptions): TInput
  mutate<TInput extends Graph | null>(Graph: TInput, options?: SetOptions): string | null
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
