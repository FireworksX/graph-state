import type { Entity, Graph, GraphState, Plugin } from '@graph-state/core';

export type Extender = (graph: Graph, cache: GraphState) => Graph;

interface ExtendMap {
  [graphType: string]: Extender;
}

declare module '@graph-state/core' {
  interface GraphState {
    extendGraph(entity: Entity, extender: ExtendMap[string]): void;
  }
}

const extendPlugin: (extendsMap?: ExtendMap) => Plugin =
  extendsMap => (graphState: GraphState) => {
    const originalMutate = graphState.mutate;

    graphState.mutate = (...args: any) => {
      const { graphKey, data, options } = graphState.getArgumentsForMutate(
        ...(args as Parameters<GraphState['getArgumentsForMutate']>)
      );
      const graph = graphState.resolve(graphKey) as Graph;
      const extender = extendsMap?.[graph?._type];

      if (extender && graphKey) {
        const extendData = extender({ ...graph, ...data }, graphState);
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

    Object.keys(extendsMap ?? {}).forEach(type => {
      const links = Array.from(graphState.types?.get?.(type) ?? []);
      links.forEach(link => {
        graphState.mutate(graphState.resolve(link) as Graph);
      });
    });

    return graphState;
  };

export default extendPlugin;
