// @ts-nocheck
import type { Entity, GraphState, Plugin } from '@graph-state/core';
import type { Graph } from '@graph-state/core';

export const isGraph = (x: unknown): x is Graph =>
  typeof x === 'object' && typeof (x as any)._type === 'string';

interface Cache<Data> {
  get(key: string): Data | undefined;
  set(key: string, value: Data): void;
  delete(key: string): void;
  keys(): IterableIterator<string>;
}

type Transform = (cache: GraphState, ...args: unknown[]) => Entity;

interface swrOptions {
  transforms?: Record<string, Transform>;
}

const PREFIX = 'Request';

const swrPlugin: (options?: swrOptions) => Plugin = options => graphState => {
  const transforms = options?.transforms ?? {};

  const applyState = (eventName: string, ...args: unknown[]) => {
    const transform = transforms[eventName];
    const nextValue = transform ? transform(graphState, ...args) : args[0];
    if (isGraph(nextValue)) {
      graphState.mutate(nextValue, { replace: true });
    } else {
      console.warn(
        `[graph-state-swr]: Skip apply state for ${eventName}. Because got not Graph.`,
        nextValue
      );
    }
  };

  graphState.get = (key: string) => {
    return graphState.resolve(`${PREFIX}:${key}`);
  };

  graphState.set = (key: string, value) => {
    applyState(key, { _type: PREFIX, _id: key, ...value });
  };

  graphState.delete = (key: string) => {
    graphState.invalidate(key);
  };

  graphState.keys = () => {
    return graphState.types;
  };

  return graphState;
};

export default swrPlugin;
