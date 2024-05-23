import type {
  Entity,
  Graph,
  GraphState,
  Plugin,
  Type,
} from '@graph-state/core';

export type Extender = (graph: Graph, cache: GraphState) => Graph;

interface ExtendMap {
  [graphType: string]: Extender;
}

declare module '@graph-state/core' {
  interface GraphState {
    extendGraph(entity: Entity, extender: Extender): void;
    declareExtendGraph(type: Type, extender: Extender): void;
  }
}

const extendPlugin: (extendsMap?: ExtendMap) => Plugin =
  extendsMap => (graphState: GraphState) => {
    const originalMutate = graphState.mutate;
    const extendersStack = new Map<Type, Extender[]>();

    const appendExtender = (type: Type, extender: Extender) => {
      if (extendersStack.has(type)) {
        extendersStack.get(type)?.push(extender);
      } else {
        extendersStack.set(type, [extender]);
      }
    };

    const recheck = () => {
      for (const type of extendersStack.keys()) {
        for (const link of graphState.types?.get?.(type) ?? []) {
          graphState.mutate(graphState.resolve(link) as Graph);
        }
      }
    };

    graphState.mutate = (...args: any) => {
      const { graphKey, data, options } = graphState.getArgumentsForMutate(
        ...(args as Parameters<GraphState['getArgumentsForMutate']>)
      );
      const graph = graphState.resolve(graphKey) as Graph;
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
        return originalMutate(graphKey, extendData, options);
      }

      return originalMutate(...(args as Parameters<GraphState['mutate']>));
    };

    graphState.extendGraph = (entity: Entity, extender: Extender) => {
      const nextGraph = extender?.(
        graphState.resolve(entity) as Graph,
        graphState
      );

      if (nextGraph) {
        graphState.mutate(nextGraph);
      }
    };

    graphState.declareExtendGraph = (type, extender) => {
      appendExtender(type, extender);
      recheck();
    };

    Object.entries(extendsMap ?? {}).forEach(([type, extender]) =>
      appendExtender(type, extender)
    );

    recheck();

    return graphState;
  };

export default extendPlugin;
