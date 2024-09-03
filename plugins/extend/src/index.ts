import type {
  Entity,
  GetStateEntity,
  GetStateEntityType,
  Graph,
  GraphState,
  Plugin,
  ResolveEntityByType,
  SetOptions,
  Type,
} from '@graph-state/core';
import { isPartialKey } from '@graph-state/core';

export type Extender<TState extends GraphState, TGraph> = (
  graph: TGraph,
  cache: TState
) => TGraph;

type ExtendMap<
  TState extends GraphState,
  TType extends GetStateEntityType<TState>,
> = Record<
  TType,
  Extender<
    TState,
    ResolveEntityByType<GetStateEntity<TState>, `${TType}:${string}`>
  >
>;

interface ExtendPluginOptions {
  excludePartialGraph?: boolean;
}

declare module '@graph-state/core' {
  interface GraphState {
    extendGraph<TEntity extends Entity>(
      entity: TEntity,
      extender: Extender<this, TEntity>,
      mutateOptions?: SetOptions
    ): void;
    declareExtendGraph<TType extends Type>(
      type: TType,
      extender: Extender<this, TType>,
      mutateOptions?: SetOptions
    ): void;
  }
}

const extendPlugin =
  <TState extends GraphState = GraphState>(
    extendsMap: ExtendMap<TState, GetStateEntityType<TState>>,
    pluginOptions?: ExtendPluginOptions
  ): Plugin =>
  graphState => {
    const originalMutate = graphState.mutate;
    const extendersStack = new Map<Type, Extender<TState, unknown>[]>();

    const appendExtender = (type: Type, extender: any) => {
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
            ...(extender(data, graphState as any) as any),
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
    graphState.extendGraph = <TEntity extends Entity>(
      entity: TEntity,
      extender: Extender<any, any>,
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

    graphState.declareExtendGraph = <TType extends Type>(
      type: TType,
      extender: Extender<any, any>,
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
