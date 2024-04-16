import { Entity, Field } from 'src'
import { get, isHTMLNode, isObject, iterator, set } from '@adstore/utils'
import { createLinkRefs } from './createLinkRefs'

type AnyObject = Record<string, unknown>

type DataSetter = AnyObject | ((prev: AnyObject) => AnyObject)

export interface GraphState extends Entity {
  resolve(input: Field): unknown | null
  buildLinks<TInput = unknown>(input: TInput, options: SetOptions): TInput
  mutate<TInput extends Entity | null>(entity: TInput, options?: SetOptions): string | null
  mutate<TInput extends string>(key: TInput, data: DataSetter, options?: SetOptions): string | null
  getArgumentsForMutate(...args: Parameters<GraphState['mutate']>): {
    entityKey: string | null
    options: SetOptions | null
    data: DataSetter
  }
  invalidate(field: Field): void
  subscribe<TInput extends Entity | string>(input: TInput, callback: (data: any) => void): () => void
  inspectFields(type: string): string[]
  keyOfEntity(entity?: Entity | null): string | null
  entityOfKey(key?: string | null): Entity | null
  resolveParents(field: Field): unknown[]
}

export interface SetOptions {
  replace?: boolean
  overrideMutateMethod?: GraphState['mutate']
}

let ID = 0
const DEEP_LIMIT = 100

export type Plugin = (state: GraphState) => GraphState

interface CreateStateOptions {
  id?: string
  initialState?: Entity
  plugins?: Plugin[]
}

export const createState = (options?: CreateStateOptions): GraphState => {
  const id = options?.id ?? `Instance:${ID++}`
  const plugins = options?.plugins ?? []
  const links = new Map<string, any>()
  const subscribes = new Map<string, ((newState: any) => any)[]>()
  const linkRefs = createLinkRefs()
  let notifyDeepIndex = 0

  const resolve = (input?: Field) => {
    if (!input) return null
    const entity = isObject(input) ? input : entityOfKey(input as string)
    const entityValue = links.get(keyOfEntity(entity as Entity)!) as Entity

    // Generate new link
    return entity && entityValue ? { ...entityValue } : null
  }

  // TODO BuildLink will make ONLY link without subscribe and notify
  const buildLinks = <TInput = unknown>(input: TInput, options?: SetOptions): TInput =>
    iterator(
      input,
      (_: PropertyKey, value: any) => {
        if (isObject(value) && keyOfEntity(value as Entity) && keyOfEntity(input as Entity)) {
          const nextLink = options?.overrideMutateMethod
            ? options.overrideMutateMethod(value as Entity, options)
            : mutate(value as Entity, options)
          if (nextLink) {
            linkRefs.addRefs(nextLink, keyOfEntity(input as Entity)!)
          }
          return nextLink
        }

        if (typeof value === 'string' && entityOfKey(value)) {
          linkRefs.addRefs(value, keyOfEntity(input as Entity)!)
        }

        return value
      },
      '',
      { skipPredicate: (value: any) => isHTMLNode(value) }
    )

  const getArgumentsForMutate = (field: string | Entity, ...args: any[]) => ({
    entityKey: typeof field === 'string' ? field : keyOfEntity(field),
    options: typeof field === 'string' ? args[1] : (args[0] as SetOptions | null),
    data: typeof field === 'string' ? args[0] : field
  })

  // TODO Add batchUpdate for deep object
  const mutate = (field: string | Entity, ...args: any[]) => {
    const { entityKey, options, data } = getArgumentsForMutate(field, ...args)

    if (!field) return null
    const currentValue = { ...(links.get(entityKey || '') ?? {}) }
    const entityData = typeof data === 'function' ? data(currentValue) : data
    const entity = {
      ...entityData,
      ...entityOfKey(entityKey)
    }

    if (entityKey) {
      const entityWithLinks = buildLinks(entity, options)

      iterator(entityWithLinks, (_: PropertyKey, value: any, path: string) => {
        const prevValue = get(currentValue, path)
        let nextValue = value

        if (!options?.replace && !isHTMLNode(value)) {
          if (Array.isArray(value) && Array.isArray(prevValue)) {
            nextValue = [...new Set([...prevValue, ...value])]
          }

          if (isObject(value) && isObject(prevValue)) {
            nextValue = {
              ...prevValue,
              ...value
            }
          }
        }

        set(currentValue, path, nextValue)
        return nextValue
      })

      links.set(entityKey, currentValue)
      notify(currentValue)
    }

    return entityKey
  }

  const invalidate = (field: Field) => {
    const key = typeof field === 'string' ? field : keyOfEntity(field)

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

  const notify = (field: Field) => {
    if (notifyDeepIndex > DEEP_LIMIT) {
      throw new Error('Too deep notify.')
    }

    const key = typeof field === 'string' ? field : keyOfEntity(field)
    const storeKey = keyOfEntity({ _type: 'State', _id: id })

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
    const key = (typeof input === 'string' ? input : keyOfEntity(input)) || ''

    if (subscribes.has(key)) {
      subscribes.set(key, [...Array.from(subscribes.get(key) || []), callback])
    } else {
      subscribes.set(key, [callback])
    }

    return () => {
      const subIndex = (subscribes.get(key) || []).findIndex(sub => sub === callback)

      if (subIndex !== -1) {
        const nextSubscribers = subscribes.get(key) || []
        nextSubscribers.splice(subIndex, 1)

        subscribes.set(key, nextSubscribers)
      }
    }
  }

  const inspectFields = (entityType: Entity['_type']) =>
    Array.from(links.entries())
      .map(([key, entity]) => (entity._type === entityType ? key : undefined))
      .filter(Boolean) as string[]

  const resolveParents = (field: Field) => {
    const key = (typeof field === 'string' ? field : keyOfEntity(field)) || ''
    const refs = linkRefs.getParents(key) ?? []

    return refs.map(resolve)
  }

  if (options?.initialState) {
    mutate(options.initialState, { replace: true })
  }

  const graphState: GraphState = {
    _type: 'State' as const,
    _id: id,
    links, // TODO Remove
    linkRefs,
    mutate,
    subscribe,
    resolve,
    inspectFields,
    invalidate,
    buildLinks,
    resolveParents,
    getArgumentsForMutate
  }

  return plugins.reduce((graphState, plugin) => plugin(graphState) ?? graphState, graphState)
}

export const keyOfEntity = (entity?: Entity | null) => {
  if (entity?._id && entity._type) {
    return `${entity._type}:${entity._id}`
  }

  if (typeof entity === 'string' && entityOfKey(entity)) {
    return entity
  }

  return null
}

export const entityOfKey = (key?: string | null | number): Entity | null => {
  if (isObject(key) && (key as any)?._type && (key as any)?._id) {
    return key as any as Entity
  }
  if (!key || typeof key !== 'string') return null

  const [typeName, ...restTypes] = key.split(':')
  if (!typeName || restTypes.length < 1) return null

  return {
    _type: typeName,
    _id: restTypes.join(':')
  }
}
