import { isValue } from 'src'
import type { DataField, Graph, CreateStateOptions, GraphState, SetOptions, Entity } from 'src'
import { isGraph, isHTMLNode, isObject, isPrimitive, shallowEqual } from './utils/checker'
import { iterator } from './utils/iterator'
import { createCache } from './cache'
import { joinKeys } from './utils/joinKeys'
import { isPartOfGraph } from './utils/isPartOfGraph'
import { uniqueLinks } from './utils/unique'
import { isDev } from './utils/isDev'

let ID = 0
const DEEP_LIMIT = 100
const STATE_TYPE = 'State'
const EACH_UPDATED = '$EACH:ROOT$'

export const createState = <TEntities extends Graph[]>(
  options?: CreateStateOptions<TEntities[number], TEntities>
): GraphState<TEntities> => {
  const id = options?.id ?? `${ID++}`
  const plugins = options?.plugins ?? []
  const keys = options?.keys ?? {}
  const stateKey = `${STATE_TYPE}:${id}`
  // const resolvers = options?.resolvers ?? {}
  const cache = createCache()
  const subscribers = new Map<string, ((newState: any) => any)[]>()
  let deepIndex = 0

  const resolve = <K extends TEntities[number]['_type']>(
    input?: `${K}:${string}` | Extract<TEntities[number], { _type: K }> | null | undefined
  ): Extract<TEntities[number], { _type: K }> | null | undefined => {
    const inputKey = isValue(input) ? keyOfEntity(input) : stateKey
    let value = inputKey ? (cache.readLink(inputKey) as Extract<TEntities[number], { _type: K }>) : null

    if (isObject(value) || Array.isArray(value)) {
      value = Object.entries(value).reduce(
        (acc, [key, value]) => {
          if (
            (isPrimitive(value) && !entityOfKey(value as any)) ||
            !isPartOfGraph(keyOfEntity(value as any), inputKey)
          ) {
            return { ...acc, [key]: value }
          }
          //@ts-ignore
          acc[key] = safeResolve(value as any)

          return acc
        },
        {} as Extract<TEntities[number], { _type: K }>
      )
    }

    return value ? { ...value } : null
  }
  //@ts-ignore
  const safeResolve: typeof resolve = input => resolve(input) ?? input

  const mutateField = <TEntities extends Graph[]>(
    input: DataField,
    parentFieldKey?: string,
    options?: SetOptions<TEntities>
  ): DataField => {
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
    const mutateMethod = options?.overrideMutateMethod || mutate
    return mutateMethod(childKey as any, input, options)
  }

  const mutate = (entity: Entity, ...args: any[]) => {
    const { graphKey: entityGraphKey, options, data } = getArgumentsForMutate(entity, ...args)
    const graphKey = entityGraphKey ?? stateKey
    const parentKey = options?.parent ?? keyOfEntity({ _type: STATE_TYPE, _id: id })
    const prevGraph = resolve((graphKey as any) ?? '')
    const internal = options?.internal || { hasChange: false }

    let graphData: Graph = {
      ...data,
      ...entityOfKey(graphKey)
    }

    if (!options?.replace && isObject(prevGraph) && isObject(graphData)) {
      graphData = {
        ...prevGraph,
        ...graphData
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
          internal
        })
      }

      if (!options?.replace && Array.isArray(fieldValue) && Array.isArray(prevValue)) {
        fieldValue = [...prevValue, ...fieldValue]
      }

      if (Array.isArray(fieldValue) && options?.dedup !== false) {
        fieldValue = uniqueLinks(...fieldValue)
      }

      internal.hasChange =
        internal.hasChange ||
        !shallowEqual(prevValue, fieldKey === fieldValue ? safeResolve(fieldValue as any) : fieldValue)

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
      const parents = cache.getLinkedRefs(key)
      const subs = subscribers.get(key) || []

      cache.invalidate(key)

      parents.forEach(parentKey => {
        const parentValue = resolve(parentKey as any)
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
      const nextResult = resolve(key as any)

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
    return refs.map(resolve as any)
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
      _id: restTypes.join(':')
    }
  }

  const getArgumentsForMutate = <TEntities extends Graph[]>(entity: string | Entity, ...args: any[]) => {
    let data = typeof entity === 'string' ? args[0] : entity
    if (typeof data === 'function') {
      data = data(resolve(entity as any))
    }

    return {
      graphKey: typeof entity === 'string' ? entity : keyOfEntity(entity),
      options: typeof entity === 'string' ? args[1] : (args[0] as SetOptions<TEntities> | undefined),
      data
    }
  }

  if (options?.initialState) {
    mutate(options.initialState as Entity, { replace: true })
  }

  const graphState: GraphState<TEntities> = {
    _type: STATE_TYPE,
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
    subscribers: isDev ? subscribers : undefined
  }

  return plugins.reduce((graphState, plugin) => plugin(graphState) ?? graphState, graphState)
}
