import type {
  Entity,
  GetStateEntity,
  GetStateEntityType,
  Graph,
  GraphState,
  Plugin,
  ResolveEntityByType,
  MutateOptions,
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
      mutateOptions?: MutateOptions
    ): void;
    declareExtendGraph<TType extends Type>(
      type: TType,
      extender: Extender<this, TType>,
      mutateOptions?: MutateOptions
    ): void;
  }
}

const extendPlugin =
  <TState extends GraphState = GraphState>(
    extendsMap: ExtendMap<TState, GetStateEntityType<TState>>,
    pluginOptions?: ExtendPluginOptions
  ): Plugin =>
  state => {
    const extendersStack = new Map<Type, Extender<TState, unknown>[]>();

    const appendExtender = (type: Type, extender: any) => {
      if (extendersStack.has(type)) {
        extendersStack.get(type)?.push(extender);
      } else {
        extendersStack.set(type, [extender]);
      }
    };

    const recheck = (mutateOptions?: MutateOptions) => {
      for (const type of extendersStack.keys()) {
        for (const link of state.types?.get?.(type) ?? []) {
          state.mutate(state.resolve(link) as Graph, mutateOptions);
        }
      }
    };

    const originalMutate = state.mutate;

    state.mutate = (...args: any[]): any => {
      const { graphKey, data, options } = state.getArgumentsForMutate(
        ...(args as Parameters<GraphState['getArgumentsForMutate']>)
      );
      if (
        graphKey &&
        pluginOptions?.excludePartialGraph &&
        isPartialKey(graphKey)
      ) {
        return originalMutate(graphKey, data, options);
      }

      /**
       * When a graph is first created, it is not yet in the cache and
       * _type = null and extenders are not triggered
       */
      const graph = (state.resolve(graphKey) ?? data) as Graph;
      const extenders = extendersStack.get(graph?._type);

      if (extenders && graphKey) {
        const initialData = { ...graph, ...data };
        const extendData = extenders.reduce(
          (data, extender) => ({
            ...data,
            ...(extender(data, state as any) as any),
          }),
          initialData
        );
        return originalMutate(graphKey, extendData, options);
      }
    };

    state.extendGraph = <TEntity extends Entity>(
      entity: TEntity,
      extender: Extender<any, any>,
      mutateOptions: MutateOptions
    ) => {
      const nextGraph = extender?.(state.resolve(entity) as Graph, state);

      if (nextGraph) {
        state.mutate(nextGraph, mutateOptions);
      }
    };

    state.declareExtendGraph = <TType extends Type>(
      type: TType,
      extender: Extender<any, any>,
      mutateOptions: MutateOptions
    ) => {
      appendExtender(type, extender);
      recheck(mutateOptions);
    };

    Object.entries(extendsMap ?? {}).forEach(([type, extender]) =>
      appendExtender(type, extender)
    );

    recheck();
  };

export default extendPlugin;
