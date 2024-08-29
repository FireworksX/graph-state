import { isValue } from '@graph-state/checkers'

export type Visitor<TReturn = unknown, TValue = unknown> = (
  key: PropertyKey,
  value: TValue,
  path: string,
  options?: IteratorOptions
) => TReturn

type FilterIteratorPredicate = (nextValue: unknown, key: string | number, input: unknown) => boolean
type SkipIteratorPredicate = (value: unknown) => boolean

interface IteratorOptions {
  filterPredicate?: FilterIteratorPredicate
  skipPredicate?: SkipIteratorPredicate
  metaInfo?: Record<PropertyKey, any>
}

const defaultFilterPredicate: FilterIteratorPredicate = () => true
const defaultSkipPredicate: SkipIteratorPredicate = () => false

export const iterator = <TVisitor extends Visitor>(
  input: unknown,
  visitor: TVisitor,
  basePath?: string,
  options?: IteratorOptions
): any => {
  const filterPredicate = options?.filterPredicate || defaultFilterPredicate
  const skipPredicate = options?.skipPredicate || defaultSkipPredicate

  if (skipPredicate(input)) return input

  if (Array.isArray(input)) {
    return input
      .map((el, index) => {
        const newPath = [basePath, index].filter(isValue).join('.')
        return iterator(visitor(index, el, newPath, options), visitor, newPath, options)
      })
      .filter(filterPredicate)
  }

  if (typeof input === 'object' && input) {
    return Object.entries(input).reduce((acc, [key, value]) => {
      const newPath = [basePath, key].filter(isValue).join('.')
      const nextValue = iterator(visitor(key, value, newPath, options), visitor, newPath, options)

      if (filterPredicate(nextValue, key, input)) {
        acc[key] = nextValue
      }
      return acc
    }, {} as any)
  }

  return input
}
