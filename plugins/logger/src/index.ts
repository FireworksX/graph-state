import type { Entity, Plugin } from '@graph-state/core';
import { isPartialKey } from '@graph-state/core';

declare module '@graph-state/core' {
  interface GraphState {
    debugLog(
      eventName: DebugEventName,
      level: DebugLevel,
      ...messages: unknown[]
    ): void;
  }
}

type DebugEventName = 'mutate' | 'invalidate' | string;
type DebugLevel = 'error' | 'warning' | 'info' | string;

interface LoggerOptions {
  onlyBrowser?: boolean;
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
    const originalInvalidate = graphState.invalidate;
    const log = (graphState.debugLog = debugLog);

    if (options?.onlyBrowser && !isBrowser) {
      return graphState;
    }

    graphState.subscribe(nextState => {
      const graphKey = graphState.keyOfEntity(nextState as Entity);

      if (graphKey && !isPartialKey(graphKey)) {
        log('mutate', 'info', 'of', graphKey, 'to', nextState);
      }
    });

    graphState.invalidate = (...args: any) => {
      log('invalidate', 'error', 'of', ...args);

      // @ts-ignore
      return originalInvalidate(...args);
    };

    return graphState;
  };

export default loggerPlugin;
