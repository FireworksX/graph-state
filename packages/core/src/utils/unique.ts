import { isLinkKey } from 'src'

export const unique = <T = unknown>(...values: T[]) => Array.from(new Set(values))

export const uniqueLinks = <T = unknown>(...values: T[]) =>
  values.filter((item, index, arr) => (isLinkKey(item) ? arr.indexOf(item) === index : true))
