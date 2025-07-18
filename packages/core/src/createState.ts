import type {
  DataField,
  Graph,
  CreateStateOptions,
  GraphState,
  MutateOptions,
  Entity,
  ResolveOptions,
  ResolveEntityByType,
  SystemFields,
  LinkKey,
  SubscribeCallback,
  SubscribeOptions,
  AnyObject,
  Plugin,
  SkipGraphPredictor,
} from 'src'
import { isGraphOrKey } from 'src'
import { getGraphLink } from 'src'
import { isPartialKey } from 'src'
import { isObject } from 'src'
import { isLinkKey, isGraph } from 'src'
import { shallowEqual, deepEqual } from './utils/checker'
import { createCache } from './cache'
import { joinKeys } from './utils/joinKeys'
import { isPartOfGraph } from './utils/isPartOfGraph'
import { uniqueLinks } from './utils/unique'
import { isDev } from './utils/isDev'
import { isPrimitive, isValue } from '@graph-state/checkers'
import { createPluginsState } from './plugins'
// import { debug as debugMessage } from './helpers/help'
import { isGraphState } from './utils/isGraphState'
import { createDebugState } from './debug'
import { warn } from './helpers/help'
import { entityOfKey as staticEntityOfKey } from './helpers/entityOfKey'
import { keyOfEntity as staticKeyOfEntity } from './helpers/keyOfEntity'

let ID = 0
const DEEP_LIMIT = 100
const STATE_TYPE = 'State'
const EACH_UPDATED = '$EACH:ROOT$'

export const createState = <TEntity extends SystemFields = SystemFields, TRootType extends LinkKey = LinkKey>(
  options?: CreateStateOptions<TEntity, TRootType>
): GraphState<TEntity, TRootType> => {
  const id = options?._id ?? `${ID++}`
  const type = options?._type ?? (STATE_TYPE as TRootType)
  const stateKey = `${type}:${id}` as const
  const skipPredictors = [isGraphState, ...(options?.skip ?? [])]
  const cache = createCache()
  const debugState = createDebugState()
  const pluginsStore = createPluginsState(options?.plugins)
  const subscribers = new Map<string, SubscribeCallback[]>()
  let deepIndex = 0

  const isSkipped = (entity: DataField) => {
    return skipPredictors.some(predictor => predictor(entity))
  }

  const resolve = <TInput extends Entity, TSelector>(
    input?: TInput,
    options?: ResolveOptions<TEntity, TInput, TSelector>
  ): TSelector extends AnyObject ? TSelector : ResolveEntityByType<TEntity, TInput> | null => {
    const isDeep = options?.deep ?? false
    const isSafe = options?.safe ?? false
    const keepLinks = options?.keepLinks ?? false
    const { selector, ...coreOptions } = options || {}
    const inputKey = isValue(input) ? keyOfEntity(input) : null
    debugState.debug({ type: 'resolve', entity: input, options })

    let value = inputKey ? (cache.readLink(inputKey) as any) : null

    if (isSkipped(value)) return value

    if (isObject(value) || Array.isArray(value)) {
      value = Object.entries(value).reduce((acc, [key, value]) => {
        let resultValue = value

        if (!isSkipped(resultValue)) {
          if (Array.isArray(value)) {
            resultValue = value.map(v => {
              if (isSkipped(v)) return v
              if (isLinkKey(v) && !isSafe && !cache.hasLink(v)) {
                return null
              }

              return (isPartOfGraph(v, inputKey) && !keepLinks) || isDeep ? safeResolve(v, coreOptions) : v
            })

            if (!isSafe) {
              resultValue = resultValue.filter(isValue)
            }
          } else {
            if (isLinkKey(value) && !isSafe && !cache.hasLink(value)) {
              resultValue = null
            } else if ((isPartOfGraph(keyOfEntity(value as any), inputKey) && !keepLinks) || isDeep) {
              resultValue = safeResolve(value, coreOptions)
            }
          }
        }

        acc[key] = resultValue
        return acc
      }, {} as Graph)
    }

    return value ? (selector ? (selector({ ...value }) as any) : { ...value }) : isSafe ? (input as any) : (null as any)
  }

  const safeResolve = <TInput extends Entity, TSelector>(
    input?: TInput,
    options?: ResolveOptions<TEntity, TInput, TSelector>
  ) => resolve(input, options) ?? input

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

  const mutateField = (input: DataField, parentFieldKey?: string, options?: MutateOptions): DataField => {
    if (((!input || isPrimitive(input)) && !isLinkKey(input)) || isSkipped(input)) {
      return input
    }

    const inputLinkKey = isGraphOrKey(input) ? keyOfEntity(input) : input

    if (isLinkKey(inputLinkKey)) {
      const parentGraph = getGraphLink(parentFieldKey) ?? ''
      const parentPaths = options?.internal?.visitors.get(parentGraph) ?? []
      const visitorsPaths = options?.internal?.visitors.get(inputLinkKey) ?? []

      if (parentPaths.includes(inputLinkKey) || inputLinkKey === parentGraph) {
        // debug(`Catch circular depend ${parentFieldKey} while set ${inputLinkKey}`)
        return null
      }

      options?.internal?.visitors?.set(inputLinkKey, [...visitorsPaths, parentGraph])
    }

    if (Array.isArray(input)) {
      return input.map(item => {
        const indexKey = parentFieldKey ? joinKeys(parentFieldKey, `${ID++}`) : undefined
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
    debugState.debug({ type: 'beforeMutate', entity: entityGraphKey, data: rawData, options })

    const data = isLinkKey(rawData) ? entityOfKey(rawData) : rawData
    const graphKey = entityGraphKey ?? stateKey
    const partialKey = isPartialKey?.(graphKey)
    const parentKey = options?.parent
    const prevGraph: any = resolve(graphKey ?? '')
    const internal = options?.internal || { hasChange: false, visitors: new Map([]) }
    let graphData: Graph = {
      ...data,
      ...entityOfKey(graphKey),
    }
    const isTopLevelGraph = !options?.parent
    const isReplace = options?.replace
      ? typeof options?.replace === 'function'
        ? options.replace(graphData)
        : options?.replace === 'deep'
          ? true
          : isTopLevelGraph || partialKey
      : false

    if (isSkipped(data)) {
      cache.writeLink(graphKey, data, parentKey)
      return graphKey
    }

    if (!isReplace && isObject(prevGraph) && isObject(graphData)) {
      graphData = {
        ...prevGraph,
        ...graphData,
      } as any
    }

    if (isReplace) {
      unlinkGraph(graphKey)
    }

    const nextGraph = Object.entries(graphData).reduce((acc, [key, value]) => {
      const fieldKey = joinKeys(graphKey, key)
      let fieldValue = value
      const prevValue = prevGraph?.[key]
      /**
       * Проверяем был ли данный ключ в данных, которые пришли в mutate.
       * Это нужно для того, чтобы дублировать значения в массив если
       * сам массив не изменялся.
       */
      const isUpdateField = isObject(data) && key in data

      if (!isSkipped(fieldValue)) {
        if (!isReplace && isUpdateField && Array.isArray(fieldValue) && Array.isArray(prevValue)) {
          fieldValue = [...prevValue, ...fieldValue]
        }

        if (isObject(fieldValue) || Array.isArray(fieldValue) || isLinkKey(fieldValue)) {
          fieldValue = mutateField(fieldValue, fieldKey, {
            ...options,
            parent: graphKey,
            internal,
          })
        }

        if (Array.isArray(fieldValue) && options?.dedup !== false) {
          fieldValue = uniqueLinks(...fieldValue)
        }
      }

      const isEqual = shallowEqual(prevValue, fieldKey === fieldValue ? safeResolve(fieldValue) : fieldValue)

      internal.hasChange = internal.hasChange || !isEqual

      if (!isReplace && isLinkKey(prevValue) && prevValue !== fieldValue) {
        cache.removeRefs(graphKey, prevValue)
        //         debug(
        //           `Garbage Collector remove link ${prevValue} from ${graphKey}.
        // Prev value: ${prevValue} (${typeof prevValue}).
        // Next value: ${fieldValue} (${typeof fieldValue}).
        // GraphKey: ${graphKey}.
        // FieldKey: ${fieldKey}.
        // `
        //         )
      }

      acc[key] = fieldValue

      return acc
    }, {} as Graph)
    cache.writeLink(graphKey, nextGraph, parentKey)

    /**
     * When complete nested updates, call GB
     */
    if (!parentKey) {
      cache.runGarbageCollector()
    }

    /**
     * Notify after remove garbage
     */
    if (internal.hasChange || isReplace) {
      notify(graphKey, prevGraph)
    }

    debugState.debug({
      type: 'afterMutate',
      entity: entityGraphKey,
      data: rawData,
      nextData: nextGraph,
      options,
      hasChange: internal.hasChange,
    })

    return graphKey
  }

  const invalidate = (entity: Entity) => {
    const key = keyOfEntity(entity)
    debugState.debug({ type: 'invalidate', entity: key })

    if (key) {
      const parents = cache.getParents(key) || []
      cache.invalidate(key)

      parents.forEach(parentKey => {
        const prevParent = cache.readLink(parentKey)
        const freshParent = resolve(parentKey, { safe: false, keepLinks: true })
        cache.writeLink(parentKey, freshParent)
        notify(parentKey, prevParent)
      })
    }
  }

  const notify = (entity: Entity, prevState: Graph | null | undefined) => {
    if (deepIndex > DEEP_LIMIT) {
      throw new Error('Too deep notify.')
    }

    const key = keyOfEntity(entity)
    debugState.debug({ type: 'notify', entity: key })

    if (key) {
      deepIndex++
      const subs = [...(subscribers.get(key) || []), ...(subscribers.get(EACH_UPDATED) || [])]
      const deps = cache.getChildren(key) || []
      const nextResult = resolve(key) as Graph

      const getSelectedValues = (selector: SubscribeOptions['selector']) => {
        const next = nextResult && selector?.(nextResult)
        const prev = prevState && selector?.(prevState)

        return { next, prev, hasChange: !deepEqual(next, prev) }
      }

      subs.forEach(({ callback, selector }) => {
        if (selector) {
          const { next, prev, hasChange } = getSelectedValues(selector)
          if (hasChange) callback(next, prev)
        } else {
          callback(nextResult, prevState)
        }
      })

      deps.forEach(dep => notify(dep, prevState))
    }

    deepIndex = 0
  }

  const subscribe = <TInput extends Entity | string = string>(...args: any[]) => {
    const input: TInput = typeof args[0] === 'function' ? EACH_UPDATED : args[0]
    const callback = typeof args[0] === 'function' ? args[0] : args[1]
    const options: SubscribeOptions | undefined = typeof args[0] === 'function' ? args[1] : args[2]
    const key = keyOfEntity(input)
    const selector = options?.selector

    if (key) {
      if (subscribers.has(key)) {
        subscribers.set(key, [...Array.from(subscribers.get(key) || []), { callback, selector }])
      } else {
        subscribers.set(key, [{ callback, selector }])
      }

      cache.onRemoveLink((link, prevValue) => {
        if (link === key) {
          notify(key, prevValue)
        }
      })
    }

    const unsubscribe = () => {
      if (key) {
        const subIndex = (subscribers.get(key) || []).findIndex(sub => sub.callback === callback)

        if (subIndex !== -1) {
          const nextSubscribers = subscribers.get(key) || []
          nextSubscribers.splice(subIndex, 1)

          subscribers.set(key, nextSubscribers)
        }
      }
    }

    if (options?.signal) {
      options.signal.addEventListener('abort', unsubscribe, { once: true })
    }

    return unsubscribe
  }

  const inspectFields = (graphType: Graph['_type']) => [...(cache.types.get(graphType) ?? [])]

  const resolveParents = (field: Entity) => {
    const key = (typeof field === 'string' ? field : keyOfEntity(field)) || ''
    const refs = cache.getParents(key) ?? []
    return refs.map(ref => resolve(ref))
  }

  const keyOfEntity = (entity: Entity) => {
    warn('Instance keyOfEntity is deprecated. Use static method keyOfEntity.')
    return staticKeyOfEntity(entity)
  }

  const entityOfKey = (entity?: Entity) => {
    warn('Instance entityOfKey is deprecated. Use static method entityOfKey.')
    return staticEntityOfKey(entity)
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
      options: typeof entity === 'string' ? args[1] : (args[0] as MutateOptions | undefined),
      data,
    }
  }

  function use(this: GraphState, plugin: Plugin) {
    pluginsStore.use(plugin)
    plugin(this)
  }

  const addSkip = (predictor: SkipGraphPredictor) => {
    skipPredictors.push(predictor)
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
    cache,
    use,
    addSkip,
    subscribers: isDev ? subscribers : undefined,
    onDebugEvent: debugState.onDebugEvent,
  }

  cache.onRemoveLink((link, prevValue) => debugState.debug({ type: 'garbageRemove', entity: link, prevValue }))

  return pluginsStore.runPlugins(graphState as any) as GraphState<TEntity, TRootType>
}
