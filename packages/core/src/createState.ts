import type { Graph, CreateStateOptions, GraphState, SetOptions, Entity } from 'src'
import type { DataField } from 'src'
import { isGraph, isHTMLNode, isObject, isPrimitive, deepEqual } from './utils/checker'
import { iterator } from './utils/iterator'
import { createCache } from './cache'
import { joinKeys } from './utils/joinKeys'
import { isPartOfGraph } from './utils/isPartOfGraph'

let ID = 0
const DEEP_LIMIT = 100
const STATE_TYPE = 'Instance'

export const createState = (options?: CreateStateOptions): GraphState => {
  const id = options?.id ?? `${ID++}`
  const plugins = options?.plugins ?? []
  const keys = options?.keys ?? {}
  // const resolvers = options?.resolvers ?? {}
  const cache = createCache()
  const subscribes = new Map<string, ((newState: any) => any)[]>()
  let deepIndex = 0

  const resolve = (input?: Entity) => {
    if (!input) return null
    const inputKey = keyOfEntity(input)
    let value = inputKey ? (cache.readLink(inputKey) as Graph) : null

    if (isObject(value) || Array.isArray(value)) {
      value = Object.entries(value).reduce((acc, [key, value]) => {
        if ((isPrimitive(value) && !entityOfKey(value as any)) || !isPartOfGraph(keyOfEntity(value as any), inputKey)) {
          return { ...acc, [key]: value }
        }

        acc[key] = safeResolve(value as any)

        return acc
      }, {} as Graph)
    }

    return value ? { ...value } : null
  }

  const safeResolve = (input?: Entity) => resolve(input) ?? input

  const mutateField = (input: DataField, parentFieldKey?: string, options?: SetOptions): DataField => {
    if (!input || isPrimitive(input) || isHTMLNode(input)) {
      return input
    }

    if (Array.isArray(input)) {
      return input.map((item, index) => {
        const indexKey = parentFieldKey ? joinKeys(parentFieldKey, `${index}`) : undefined
        return mutateField(item, indexKey, options)
      })
    }

    const entityKey = isGraph(input) ? keyOfEntity(input) : null
    const childKey = entityKey ?? parentFieldKey

    return mutate(childKey, input, options)
  }

  const mutate = (entity: Entity, ...args: any[]) => {
    let hasChange = false
    const { graphKey, options, data } = getArgumentsForMutate(entity, ...args)
    const parentKey = options?.parent ?? keyOfEntity({ _type: STATE_TYPE, _id: id })
    const prevGraph = resolve(graphKey ?? '')

    let graphData: Graph = {
      ...data,
      ...entityOfKey(graphKey),
    }

    if (!options?.replace && isObject(prevGraph) && isObject(graphData)) {
      graphData = {
        ...prevGraph,
        ...graphData,
      }
    }

    const nextGraph = Object.entries(graphData).reduce((acc, [key, value]) => {
      const fieldKey = joinKeys(graphKey, key)
      let fieldValue = value
      const prevValue = prevGraph?.[key]

      if (isObject(fieldValue) || Array.isArray(fieldValue)) {
        fieldValue = mutateField(fieldValue, fieldKey, {
          ...options,
          parent: graphKey,
        })
      }

      if (!options?.replace && Array.isArray(fieldValue) && Array.isArray(prevValue)) {
        fieldValue = [...prevValue, ...fieldValue]
      }

      if (!deepEqual(prevValue, fieldValue === fieldKey ? safeResolve(fieldValue) : fieldValue) && !hasChange) {
        hasChange = true
      }

      acc[key] = fieldValue

      return acc
    }, {} as Graph)

    cache.writeLink(graphKey, nextGraph, parentKey)

    if (hasChange) {
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
      const parents = cache.getLinkedRefs(key)
      const subs = subscribes.get(key) || []

      cache.invalidate(key)

      parents.forEach(parentKey => {
        const parentValue = resolve(parentKey)
        const validate = (value: any) => entityOfKey(value) && cache.hasLink(value)
        const freshParent = iterator(parentValue, (_: PropertyKey, value: any) => {
          if (Array.isArray(value)) {
            return value.filter(validate)
          }

          if (entityOfKey(value as any) && !validate(value)) {
            return null
          }

          return value
        })

        cache.writeLink(parentKey, freshParent)

        notify(parentKey)
      })
      subs.forEach(cb => cb(null))

      subscribes.delete(key)
    }
  }

  const notify = (entity: Entity) => {
    if (deepIndex > DEEP_LIMIT) {
      throw new Error('Too deep notify.')
    }

    const key = keyOfEntity(entity)
    const storeKey = keyOfEntity({ _type: STATE_TYPE, _id: id })

    if (key) {
      deepIndex++
      const subs = subscribes.get(key) || []
      const deps = cache.getChildren(key) || []
      const nextResult = resolve(key)

      if (storeKey) {
        subscribes.get(storeKey)?.forEach(cb => {
          cb(nextResult)
        })
      }

      if (!nextResult) return
      subs.forEach(cb => {
        cb(nextResult)
      })
      deps.forEach(notify)
    }

    deepIndex = 0
  }

  // TODO Add subscribe for all state
  const subscribe = <TInput extends Entity | string>(input: TInput, callback: (data: any) => void) => {
    const key = keyOfEntity(input)

    if (key) {
      if (subscribes.has(key)) {
        subscribes.set(key, [...Array.from(subscribes.get(key) || []), callback])
      } else {
        subscribes.set(key, [callback])
      }
    }

    return () => {
      if (key) {
        const subIndex = (subscribes.get(key) || []).findIndex(sub => sub === callback)

        if (subIndex !== -1) {
          const nextSubscribers = subscribes.get(key) || []
          nextSubscribers.splice(subIndex, 1)

          subscribes.set(key, nextSubscribers)
        }
      }
    }
  }

  const inspectFields = (graphType: Graph['_type']) => [...(cache.types.get(graphType) ?? [])]

  const resolveParents = (field: Entity) => {
    const key = (typeof field === 'string' ? field : keyOfEntity(field)) || ''
    const refs = cache.getParents(key) ?? []
    return refs.map(resolve)
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
    } else if (entity.id || entity._id) {
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
    }

    return {
      graphKey: typeof entity === 'string' ? entity : keyOfEntity(entity),
      options: typeof entity === 'string' ? args[1] : (args[0] as SetOptions | undefined),
      data,
    }
  }

  if (options?.initialState) {
    mutate(options.initialState, { replace: true })
  }

  const graphState: GraphState = {
    _type: STATE_TYPE,
    _id: id,
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
    cache,
  }

  return plugins.reduce((graphState, plugin) => plugin(graphState) ?? graphState, graphState)
}
