import type { AnyObject, DataField, Graph, LinkKey } from 'src'
import {
  isLinkKey as isLinkKeyChecker,
  isGraphOrKey as isGraphOrKeyChecker,
  isGraph as isGraphChecker,
  isObject as isObjectChecker,
  isPrimitive,
} from '@graph-state/checkers'

export const isLinkKey = (input: unknown): input is LinkKey => isLinkKeyChecker(input)
export const isGraphOrKey = (input: unknown): input is Graph | LinkKey => isGraphOrKeyChecker(input)
export const isGraph = (input: unknown): input is Graph => isGraphChecker(input)
export const isObject = (input: unknown): input is AnyObject => isObjectChecker(input)

export const shallowEqual = (a: DataField, b: DataField) => {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((val, index) => b[index] === val)
  }

  if (!isObject(a) || !isObject(b)) return false

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!keysB.includes(key)) return false
    const aValue = a[key]
    const bValue = b[key]
    if (isPrimitive(aValue) && isPrimitive(bValue) && aValue !== bValue) return false
  }

  return true
}
