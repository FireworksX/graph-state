import type { GraphState } from 'src'
import { isObject } from 'src'

export const isGraphState = (input: unknown): input is GraphState => {
  if (!input) return false

  if (isObject(input)) {
    const fields = ['_id', '_type', 'key', 'mutate', 'resolve']
    return fields.every(field => field in input)
  }

  return false
}
