import type { Graph, CreateStateOptions, GraphState, SetOptions, Entity } from 'src'
import { createLinkRefs } from './createLinkRefs'
import { isHTMLNode, isObject } from './utils/checker'
import { iterator } from './utils/iterator'
import { get } from './utils/get'
import { set } from 'src/utils/set'
import { isDev } from './helpers/isDev'
import { errorLog } from './utils/logger'

let ID = 0
const DEEP_LIMIT = 100

const STATE_TYPE = 'State'

export const createState = (options?: CreateStateOptions): GraphState => {
  const id = options?.id ?? `Instance:${ID++}`
  const plugins = options?.plugins ?? []
  const keys = options?.keys ?? {}
  const links = new Map<string, any>()
  const subscribes = new Map<string, ((newState: any) => any)[]>()
  const linkRefs = createLinkRefs()
  let notifyDeepIndex = 0

  const resolve = (input?: Entity) => {
    if (!input) return null
    const inputKey = keyOfEntity(input)
    const value = inputKey ? (links.get(inputKey) as Graph) : null

    return value ? { ...value } : null
  }

  // TODO BuildLink will make ONLY link without subscribe and notify
  const buildLinks = <TInput = unknown>(input: TInput, options?: SetOptions): TInput =>
    iterator(
      input,
      (_: PropertyKey, value: any) => {
        const inputKey = keyOfEntity(input as Entity)
        const valueKey = keyOfEntity(value as Entity)

        if (isObject(value) && valueKey) {
          const nextLink = options?.overrideMutateMethod
            ? options.overrideMutateMethod(value as Graph, options)
            : mutate(value as Graph, options)

          if (nextLink && inputKey) {
            linkRefs.addRefs(nextLink, inputKey)
          }
          return nextLink
        }

        if (typeof value === 'string' && entityOfKey(value) && inputKey) {
          linkRefs.addRefs(value, inputKey!)
        }

        if (isDev) {
          if (isObject(value) && '_type' in value && !valueKey) {
            errorLog(
              `Can't build a key for "${value._type}" type with ${JSON.stringify(value)} value. Pass _id, id property or define key.`
            )
          }
        }

        return value
      },
      '',
      { skipPredicate: (value: any) => isHTMLNode(value) }
    )

  // TODO Add batchUpdate for deep object
  const mutate = (entity: Entity, ...args: any[]) => {
    const { graphKey, options, data } = getArgumentsForMutate(entity, ...args)

    if (!graphKey) return null
    const currentValue = { ...(links.get(graphKey ?? '') ?? {}) }
    const graphData = typeof data === 'function' ? data(currentValue) : data
    const graph = {
      ...graphData,
      ...entityOfKey(graphKey),
    }

    const graphWithLinks = buildLinks(graph, options)

    if (graphKey) {
      iterator(graphWithLinks, (_: PropertyKey, value: any, path: string) => {
        const prevValue = get(currentValue, path)
        let nextValue = value

        if (!options?.replace && !isHTMLNode(value)) {
          if (Array.isArray(value) && Array.isArray(prevValue)) {
            nextValue = [...new Set([...prevValue, ...value])]
          }

          if (isObject(value) && isObject(prevValue)) {
            nextValue = {
              ...prevValue,
              ...value,
            }
          }
        }

        set(currentValue, path, nextValue)
        return nextValue
      })

      links.set(graphKey, currentValue)
      notify(currentValue)
    }

    return graphKey
  }

  const invalidate = (enity: Entity) => {
    const key = keyOfEntity(enity)

    if (key) {
      links.delete(key)
      const parents = linkRefs.getLinkedRefs(key)
      const subs = subscribes.get(key) || []
      linkRefs.invalidateRef(key)

      parents.forEach(parentKey => {
        const parentValue = resolve(parentKey)
        const validate = (value: any) => entityOfKey(value) && links.has(value)
        const freshParent = iterator(parentValue, (_: PropertyKey, value: any) => {
          if (Array.isArray(value)) {
            return value.filter(validate)
          }

          if (entityOfKey(value as any) && !validate(value)) {
            return null
          }

          return value
        })

        links.set(parentKey, freshParent)
        notify(parentKey)
      })
      subs.forEach(cb => cb(null))

      subscribes.delete(key)
    }
  }

  const notify = (entity: Entity) => {
    if (notifyDeepIndex > DEEP_LIMIT) {
      throw new Error('Too deep notify.')
    }

    const key = keyOfEntity(entity)
    const storeKey = keyOfEntity({ _type: STATE_TYPE, _id: id })

    if (key) {
      notifyDeepIndex++
      const subs = subscribes.get(key) || []
      const deps = linkRefs.getChildren(key) || []
      const nextResult = resolve(key)

      if (!nextResult) return

      subs.forEach(cb => {
        cb(nextResult)
      })

      deps.forEach(notify)

      if (storeKey) {
        subscribes.get(storeKey)?.forEach(cb => {
          cb(nextResult)
        })
      }
    }

    notifyDeepIndex = 0
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

  const inspectFields = (graphType: Graph['_type']) =>
    Array.from(links.entries())
      .map(([key, graph]) => (graph._type === graphType ? key : undefined))
      .filter(Boolean) as string[]

  const resolveParents = (field: Entity) => {
    const key = (typeof field === 'string' ? field : keyOfEntity(field)) || ''
    const refs = linkRefs.getParents(key) ?? []

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

  const entityOfKey = (key?: string | null) => {
    if (isObject(key) && (key as any)?._type && keyOfEntity(key)) {
      return key as any as Graph
    }
    if (!key || typeof key !== 'string') return null

    const [typeName, ...restTypes] = key.split(':')
    if (!typeName || restTypes.length < 1) return null

    return {
      _type: typeName,
      _id: restTypes.join(':'),
    }
  }

  const getArgumentsForMutate = (entity: string | Entity, ...args: any[]) => ({
    graphKey: typeof entity === 'string' ? entity : keyOfEntity(entity),
    options: typeof entity === 'string' ? args[1] : (args[0] as SetOptions | undefined),
    data: typeof entity === 'string' ? args[0] : entity,
  })

  if (options?.initialState) {
    mutate(options.initialState, { replace: true })
  }

  const graphState: GraphState = {
    _type: STATE_TYPE,
    _id: id,
    mutate,
    subscribe,
    resolve,
    inspectFields,
    invalidate,
    buildLinks,
    resolveParents,
    keyOfEntity,
    entityOfKey,
    links,
    getArgumentsForMutate,
  }

  return plugins.reduce((graphState, plugin) => plugin(graphState) ?? graphState, graphState)
}
