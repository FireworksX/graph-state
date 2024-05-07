import type { Plugin } from '@graph-state/core';

interface LoggerOptions {
  onlyBrowser?: boolean;
}

const isBrowser = typeof window !== 'undefined';

const loggerPlugin: (options?: LoggerOptions) => Plugin =
  options => graphState => {
    const originalMutate = graphState.mutate;
    const originalInvalidate = graphState.invalidate;

    const mutationLog = (
      targetKey: unknown,
      nextState: unknown,
      options?: unknown
    ) => {
      if (options) {
        // eslint-disable-next-line no-console
        console.debug(
          '%c Mutation of',
          'color: #03A9F4; font-weight: bold',
          targetKey,
          'to',
          nextState,
          'with options',
          options
        );
      } else {
        // eslint-disable-next-line no-console
        console.debug(
          '%c Mutation of',
          'color: #03A9F4; font-weight: bold',
          targetKey,
          'to',
          nextState
        );
      }
    };

    const invalidateLog = (...options: any) =>
      // eslint-disable-next-line no-console
      console.debug(
        '%c Invalidate',
        'color: #ff4848; font-weight: bold',
        ...options
      );

    if (options?.onlyBrowser && !isBrowser) {
      return graphState;
    }

    graphState.mutate = (...args: any) => {
      const { graphKey, options, data } = graphState.getArgumentsForMutate(
        // @ts-ignore
        ...args
      );

      if (typeof data === 'function') {
        const setterResult = data(graphState.resolve(graphKey) as any);
        mutationLog(graphKey, setterResult, options);
      } else {
        mutationLog(graphKey, data, options);
      }

      // @ts-ignore
      return originalMutate(...args);
    };

    graphState.invalidate = (...args: any) => {
      invalidateLog(...args);

      // @ts-ignore
      return originalInvalidate(...args);
    };

    return graphState;
  };

export default loggerPlugin;
