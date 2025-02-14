import type { Plugin } from '@graph-state/core';

declare module '@graph-state/core' {
  interface GraphState {
    debugLog(
      eventName: DebugEventName,
      level: DebugLevel,
      ...messages: unknown[]
    ): void;
  }
}

type DebugEventName = 'mutate' | 'invalidate' | 'notify' | 'resolve' | string;
type DebugLevel = 'error' | 'warning' | 'info' | string;

interface LoggerOptions {
  onlyBrowser?: boolean;
  events: DebugEventName[];
}

const isBrowser = typeof window !== 'undefined';

const debugLog = (
  eventName: DebugEventName,
  level: DebugLevel,
  ...messages: unknown[]
) => {
  const capitalizeEventName =
    eventName.charAt(0).toUpperCase() + eventName.slice(1);

  const colorsMap: Record<DebugLevel, string> = {
    info: '#03A9F4',
    error: '#ff4848',
    warning: '#ffc548',
  };

  // eslint-disable-next-line no-console
  console.debug(
    `%c ${capitalizeEventName}`,
    `color: ${colorsMap[level]}; font-weight: bold`,
    ...messages
  );
};

const loggerPlugin: (options?: LoggerOptions) => Plugin =
  options => graphState => {
    if (options?.onlyBrowser && !isBrowser) {
      return graphState;
    }

    const log = (graphState.debugLog = debugLog);

    graphState.onDebugEvent(event => {
      if (!!options?.events && !options?.events?.includes(event.type)) return;

      switch (event.type) {
        case 'beforeMutate':
          log('before mutate', 'info', 'of', event.entity);
          return;
        case 'afterMutate':
          log('after mutate', 'info', 'of', event.entity, 'to', event.nextData);
          return;
        case 'invalidate':
          log('invalidate', 'error', 'of', event.entity);
          return;
        case 'notify':
          log('notify', 'info', 'of', event.entity);
          return;
        case 'resolve':
          log('resolve', 'info', 'of', event.entity);
          return;
        case 'garbageRemove':
          log('Garbage Collector', 'warning', 'of', event.entity);
          return;
      }
    });

    return graphState;
  };

export default loggerPlugin;
