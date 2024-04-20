export type Field = string | Entity | null
export type Entity<T extends object = object> = {
  _type: string
  _id: string
} & T

export type FieldToEntity<TField extends Field> = TField extends null
  ? null
  : TField extends Entity
    ? TField
    : TField extends `${infer TType}:${infer TKey}`
      ? { _type: TType; _id: TKey }
      : TField

export type Links<TInput extends Entity> = {
  [TKey in keyof TInput]: TInput[TKey] extends (infer TArrayValue)[]
    ? TArrayValue extends Entity
      ? string[]
      : TArrayValue
    : TInput[TKey] extends Record<PropertyKey, infer TObjValue>
      ? TObjValue extends Entity
        ? Record<PropertyKey, string>
        : TObjValue
      : TInput[TKey]
}
