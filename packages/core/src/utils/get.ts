import { AnyObject } from "../types";

export const get = (obj: AnyObject, path: string, defValue?: unknown): any => {
  if (!path) return undefined
  const pathArray = (Array.isArray(path) ? path : path.match(/([^[.\]])+/g)) as string[]
  const result = pathArray.reduce((prevObj: AnyObject, key: string) => prevObj && prevObj[key], obj)
  // If found value is undefined return default value; otherwise return the value
  return result === undefined ? defValue : result
}