import type { Entity, MutateOptions, ResolveOptions } from './types'

export interface WithTimestamp {
  timestamp: number
}

interface DebugBeforeMutateEvent {
  type: 'beforeMutate'
  entity: Entity
  data: unknown
  options: MutateOptions
}

interface DebugAfterMutateEvent {
  type: 'afterMutate'
  entity: Entity
  data: unknown
  nextData: unknown
  options: MutateOptions
  hasChange: boolean
}

interface DebugResolveEvent {
  type: 'resolve'
  entity: Entity
  options?: ResolveOptions
}

interface DebugNotifyEvent {
  type: 'notify'
  entity: Entity
}

interface DebugInvalidateEvent {
  type: 'invalidate'
  entity: Entity
}

interface DebugGarbageRemoveEvent {
  type: 'garbageRemove'
  entity: Entity
  prevValue: Entity
}

export type DebugEvent =
  | DebugBeforeMutateEvent
  | DebugAfterMutateEvent
  | DebugResolveEvent
  | DebugNotifyEvent
  | DebugInvalidateEvent
  | DebugGarbageRemoveEvent

export type DebugCallback = (event: DebugEvent & WithTimestamp) => void

export const createDebugState = () => {
  const listeners = new Set<DebugCallback>()

  const onDebugEvent = (callback: DebugCallback) => {
    listeners.add(callback)
  }

  const debug = (event: DebugEvent) => {
    listeners.forEach(callback => {
      callback({ ...event, timestamp: Date.now() })
    })
  }

  return {
    debug,
    onDebugEvent,
  }
}
