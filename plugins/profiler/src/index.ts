import type { Plugin } from '@graph-state/core';
import type { DebugEvent, WithTimestamp } from '@graph-state/core/src/debug';

interface PluginOptions {}

const profilerPlugin: (options?: PluginOptions) => Plugin = () => {
  return state => {
    let currentMutate: any = null;
    let events: (DebugEvent & WithTimestamp)[] = [];

    const printResult = () => {
      const startEvent = events.at(0);
      const endEvent = events.at(-1);
      const duration =
        (endEvent?.timestamp ?? 0) - (startEvent?.timestamp ?? 0);

      // eslint-disable-next-line no-console
      console.debug(
        `%c [GraphState Profiler]`,
        `color: #ffc548; font-weight: bold`,
        `Mutate of ${startEvent?.entity} with ${duration}ms. Other events`,
        events
      );
    };

    state.onDebugEvent(event => {
      if (event.type === 'beforeMutate') {
        currentMutate = event;
        events = [];
      }

      if (currentMutate) {
        events.push(event);
      }

      if (
        event.type === 'afterMutate' &&
        event.entity === currentMutate?.entity
      ) {
        printResult();
        currentMutate = null;
      }
    });
  };
};

export default profilerPlugin;
