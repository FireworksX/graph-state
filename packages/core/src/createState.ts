import type {
  DataField,
  Graph,
  CreateStateOptions,
  GraphState,
  SetOptions,
  Entity,
  ResolveOptions,
  ResolveEntityByType,
  SystemFields,
  LinkKey,
} from 'src'
import { isPartialKey } from 'src'
import { isObject } from 'src'
import { isLinkKey, isGraph } from 'src'
import { shallowEqual } from './utils/checker'
import { createCache } from './cache'
import { joinKeys } from './utils/joinKeys'
import { isPartOfGraph } from './utils/isPartOfGraph'
import { uniqueLinks } from './utils/unique'
import { isDev } from './utils/isDev'
import { isPrimitive, isValue } from '@graph-state/checkers'

let ID = 0
const DEEP_LIMIT = 100
const STATE_TYPE = 'State'
const EACH_UPDATED = '$EACH:ROOT$'

export const createState = <TEntity extends SystemFields = SystemFields, TRootType extends LinkKey = LinkKey>(
  options?: CreateStateOptions<TEntity, TRootType>
): GraphState<TEntity, TRootType> => {
  const id = options?.id ?? `${ID++}`
  const type = options?.type ?? (STATE_TYPE as TRootType)
  const plugins = options?.plugins ?? []
  const keys = options?.keys ?? {}
  const stateKey = `${type}:${id}` as const
  const skipPredictors = options?.skip ?? []
  const cache = createCache()
  const subscribers = new Map<string, ((newState: any) => any)[]>()
  let deepIndex = 0

  const isSkipped = (entity: DataField) => {
    return skipPredictors.some(predictor => predictor(entity))
  }

  const resolve = <TInput extends Entity>(
    input?: TInput,
    options?: ResolveOptions
  ): ResolveEntityByType<TEntity, TInput> | null => {
    const isDeep = options?.deep ?? false
    const isSafe = options?.safe ?? true
    const inputKey = isValue(input) ? keyOfEntity(input) : null
    let value = inputKey ? (cache.readLink(inputKey) as any) : null

    if (isSkipped(value)) return value

    if (isObject(value) || Array.isArray(value)) {
      value = Object.entries(value).reduce((acc, [key, value]) => {
        let resultValue = value

        if (!isSkipped(resultValue)) {
          if (Array.isArray(value)) {
            resultValue = value.map(v => {
              if (isLinkKey(v) && !isSafe && !cache.hasLink(v)) {
                return null
              }

              return isPartOfGraph(v, inputKey) || isDeep ? safeResolve(v, options) : v
            })

            if (!isSafe) {
              resultValue = resultValue.filter(isValue)
            }
          } else {
            if (isLinkKey(value) && !isSafe && !cache.hasLink(value)) {
              resultValue = null
            } else if (isPartOfGraph(keyOfEntity(value as any), inputKey) || isDeep) {
              resultValue = safeResolve(value, options)
            }
          }
        }

        acc[key] = resultValue
        return acc
      }, {} as Graph)
    }

    return value ? { ...value } : null
  }

  const safeResolve = (input?: Entity, options?: ResolveOptions) => resolve(input, options) ?? input

  const unlinkGraph = (entity: Entity) => {
    const graphKey = keyOfEntity(entity)

    if (graphKey) {
      const deps = cache.getChildren(graphKey) || []
      deps.forEach(depLink => {
        if (!isPartialKey(depLink)) {
          cache.removeRefs(graphKey, depLink)
        }
      })
    }
  }

  const mutateField = (input: DataField, parentFieldKey?: string, options?: SetOptions): DataField => {
    if ((!input || isPrimitive(input)) && !isLinkKey(input)) {
      return input
    }

    if (Array.isArray(input)) {
      return input.map((item, index) => {
        const indexKey = parentFieldKey ? joinKeys(parentFieldKey, `${index}`) : undefined
        return mutateField(item, indexKey, options)
      })
    }

    const entityKey = isLinkKey(input) ? input : isGraph(input) ? keyOfEntity(input) : null
    const childKey = entityKey ?? parentFieldKey
    const mutateMethod = options?.overrideMutateMethod || mutate
    return mutateMethod(childKey as any, input, options)
  }

  const mutate = (entity: Entity, ...args: any[]) => {
    const { graphKey: entityGraphKey, options, data: rawData } = getArgumentsForMutate(entity, ...args)
    const data = isLinkKey(rawData) ? entityOfKey(rawData) : rawData
    const graphKey = entityGraphKey ?? stateKey
    const parentKey = options?.parent
    const prevGraph: any = resolve(graphKey ?? '')
    const internal = options?.internal || { hasChange: false }

    let graphData: Graph = {
      ...data,
      ...entityOfKey(graphKey),
    }
    if (isSkipped(data)) {
      cache.writeLink(graphKey, data, parentKey)
      return graphKey
    }

    if (!options?.replace && isObject(prevGraph) && isObject(graphData)) {
      graphData = {
        ...prevGraph,
        ...graphData,
      } as any
    }

    unlinkGraph(graphKey)

    const nextGraph = Object.entries(graphData).reduce((acc, [key, value]) => {
      const fieldKey = joinKeys(graphKey, key)
      let fieldValue = value
      const prevValue = prevGraph?.[key]

      if (!isSkipped(fieldValue)) {
        if (isObject(fieldValue) || Array.isArray(fieldValue) || isLinkKey(fieldValue)) {
          fieldValue = mutateField(fieldValue, fieldKey, {
            ...options,
            parent: graphKey,
            internal,
          })
        }

        if (!options?.replace && Array.isArray(fieldValue) && Array.isArray(prevValue)) {
          fieldValue = [...prevValue, ...fieldValue]
        }

        if (Array.isArray(fieldValue) && options?.dedup !== false) {
          fieldValue = uniqueLinks(...fieldValue)
        }
      }

      internal.hasChange =
        internal.hasChange || !shallowEqual(prevValue, fieldKey === fieldValue ? safeResolve(fieldValue) : fieldValue)

      acc[key] = fieldValue

      return acc
    }, {} as Graph)

    cache.writeLink(graphKey, nextGraph, parentKey)

    if (internal.hasChange) {
      notify(graphKey)
    }

    /**
     * When complete nested updates, call GB
     */

    if (!parentKey) {
      cache.runGarbageCollector()
    }

    return graphKey
  }

  const invalidate = (entity: Entity) => {
    const key = keyOfEntity(entity)

    if (key) {
      const parents = cache.getParents(key) || []
      const subs = subscribers.get(key) || []
      cache.invalidate(key)

      parents.forEach(parentKey => {
        const freshParent = resolve(parentKey, { safe: false })

        cache.writeLink(parentKey, freshParent)
        notify(parentKey)
      })
      subs.forEach(cb => cb(null))
    }
  }

  const notify = (entity: Entity) => {
    if (deepIndex > DEEP_LIMIT) {
      throw new Error('Too deep notify.')
    }

    const key = keyOfEntity(entity)
    if (key) {
      deepIndex++
      const subs = subscribers.get(key) || []
      const deps = cache.getChildren(key) || []
      const nextResult = resolve(key)

      subscribers.get(EACH_UPDATED)?.forEach(cb => {
        cb(nextResult)
      })

      if (!nextResult) return
      subs.forEach(cb => {
        cb(nextResult)
      })
      deps.forEach(notify)
    }

    deepIndex = 0
  }

  const subscribe = <TInput extends Entity | string = string>(...args: any[]) => {
    const input: TInput = typeof args[0] === 'function' ? EACH_UPDATED : args[0]
    const callback = typeof args[0] === 'function' ? args[0] : args[1]
    const key = keyOfEntity(input)

    if (key) {
      if (subscribers.has(key)) {
        subscribers.set(key, [...Array.from(subscribers.get(key) || []), callback])
      } else {
        subscribers.set(key, [callback])
      }
    }

    return () => {
      if (key) {
        const subIndex = (subscribers.get(key) || []).findIndex(sub => sub === callback)

        if (subIndex !== -1) {
          const nextSubscribers = subscribers.get(key) || []
          nextSubscribers.splice(subIndex, 1)

          subscribers.set(key, nextSubscribers)
        }
      }
    }
  }

  const inspectFields = (graphType: Graph['_type']) => [...(cache.types.get(graphType) ?? [])]

  const resolveParents = (field: Entity) => {
    const key = (typeof field === 'string' ? field : keyOfEntity(field)) || ''
    const refs = cache.getParents(key) ?? []
    return refs.map(ref => resolve(ref))
  }

  const keyOfEntity = (entity: Entity) => {
    if (typeof entity === 'string') {
      return entityOfKey(entity) ? entity : null
    }
    if (!entity?._type) {
      return null
    }

    let entityId: string | null = null

    if (entity._type in keys) {
      entityId = keys[entity._type]?.(entity) ?? null
    } else if (isValue(entity.id) || isValue(entity._id)) {
      entityId = `${entity.id ?? entity._id}`
    }

    return !entityId ? entityId : `${entity._type}:${entityId}`
  }

  const entityOfKey = (entity?: Entity) => {
    if (isObject(entity) && (entity as any)?._type && keyOfEntity(entity)) {
      return entity as any as Graph
    }
    if (!entity || typeof entity !== 'string') return null

    const [typeName, ...restTypes] = entity.split(':')
    if (!typeName || restTypes.length < 1) return null

    return {
      _type: typeName,
      _id: restTypes.join(':'),
    }
  }

  const getArgumentsForMutate = (entity: string | Entity, ...args: any[]) => {
    let data = typeof entity === 'string' ? args[0] : entity
    if (typeof data === 'function') {
      data = data(resolve(entity))
    } else if (isLinkKey(data)) {
      data = entityOfKey(data)
    }

    return {
      graphKey: typeof entity === 'string' ? entity : keyOfEntity(entity),
      options: typeof entity === 'string' ? args[1] : (args[0] as SetOptions | undefined),
      data,
    }
  }

  if (options?.initialState) {
    mutate(options.initialState as any, { replace: true })
  }

  const graphState: GraphState<TEntity, TRootType> = {
    _type: type,
    _id: id,
    key: stateKey,
    mutate,
    subscribe,
    resolve,
    safeResolve,
    resolveParents,
    inspectFields,
    invalidate,
    keyOfEntity,
    entityOfKey,
    getArgumentsForMutate,
    types: cache.types,
    cache: isDev ? cache : undefined,
    subscribers: isDev ? subscribers : undefined,
    onRemoveLink: cache.onRemoveLink,
  }

  return plugins.reduce((graphState, plugin) => plugin(graphState) ?? graphState, graphState)
}
