import type {
  Entity,
  Graph,
  GraphState,
  Plugin,
  SetOptions,
  Type,
} from '@graph-state/core';
import { isPartialKey } from '@graph-state/core';

export type Extender = (graph: Graph, cache: GraphState) => Graph;

interface ExtendMap {
  [graphType: string]: Extender;
}

interface ExtendPluginOptions {
  excludePartialGraph?: boolean;
}

declare module '@graph-state/core' {
  interface GraphState {
    extendGraph(
      entity: Entity,
      extender: Extender,
      mutateOptions?: SetOptions
    ): void;
    declareExtendGraph(
      type: Type,
      extender: Extender,
      mutateOptions?: SetOptions
    ): void;
  }
}

const extendPlugin: (
  extendsMap?: ExtendMap,
  pluginOptions?: ExtendPluginOptions
) => Plugin = (extendsMap, pluginOptions) => (graphState: GraphState) => {
  const originalMutate = graphState.mutate;
  const extendersStack = new Map<Type, Extender[]>();

  const appendExtender = (type: Type, extender: Extender) => {
    if (extendersStack.has(type)) {
      extendersStack.get(type)?.push(extender);
    } else {
      extendersStack.set(type, [extender]);
    }
  };

  const recheck = (mutateOptions?: SetOptions) => {
    for (const type of extendersStack.keys()) {
      for (const link of graphState.types?.get?.(type) ?? []) {
        graphState.mutate(graphState.resolve(link) as Graph, mutateOptions);
      }
    }
  };

  const overrideMethod: GraphState['mutate'] = (...args: any) => {
    const { graphKey, data, options } = graphState.getArgumentsForMutate(
      ...(args as Parameters<GraphState['getArgumentsForMutate']>)
    );
    if (
      graphKey &&
      pluginOptions?.excludePartialGraph &&
      isPartialKey(graphKey)
    ) {
      return originalMutate(graphKey, data, {
        ...options,
        overrideMutateMethod: overrideMethod,
      });
    }

    /**
     * When a graph is first created, it is not yet in the cache and
     * _type = null and extenders are not triggered
     */
    const graph = (graphState.resolve(graphKey) ?? data) as Graph;
    const extenders = extendersStack.get(graph?._type);

    if (extenders && graphKey) {
      const initialData = { ...graph, ...data };
      const extendData = extenders.reduce(
        (data, extender) => ({
          ...data,
          ...extender(data, graphState),
        }),
        initialData
      );
      return originalMutate(graphKey, extendData, {
        ...options,
        overrideMutateMethod: overrideMethod,
      });
    }

    return originalMutate(...(args as Parameters<GraphState['mutate']>));
  };

  graphState.mutate = overrideMethod;
  graphState.extendGraph = (
    entity: Entity,
    extender: Extender,
    mutateOptions: SetOptions
  ) => {
    const nextGraph = extender?.(
      graphState.resolve(entity) as Graph,
      graphState
    );

    if (nextGraph) {
      graphState.mutate(nextGraph, mutateOptions);
    }
  };

  graphState.declareExtendGraph = (
    type: Type,
    extender: Extender,
    mutateOptions: SetOptions
  ) => {
    appendExtender(type, extender);
    recheck(mutateOptions);
  };

  Object.entries(extendsMap ?? {}).forEach(([type, extender]) =>
    appendExtender(type, extender)
  );

  recheck();

  return graphState;
};

export default extendPlugin;
