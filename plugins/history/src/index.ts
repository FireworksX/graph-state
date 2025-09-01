import type { Graph, Plugin } from '@graph-state/core';

interface HistoryState<T = any> {
  past: T[];
  future: T[];
  limit: number;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

declare module '@graph-state/core' {
  interface GraphState {
    $history: HistoryState;
  }
}

const historyPlugin =
  (limit: number = 50): Plugin =>
  state => {
    let isApply = false;

    (state as any).subscribe(
      (_: any, prevGraph: Graph) => {
        if (!isApply) {
          state.$history.past.push(prevGraph);

          // ограничение длины истории
          if (state.$history.past.length > limit) {
            state.$history.past.shift();
          }

          // при любом новом действии сбрасываем redo
          state.$history.future = [];
        }
      },
      {
        directChangesOnly: true,
      }
    );

    const redo = () => {
      const next = state.$history.future.pop();
      if (!next) return;

      // текущее состояние кладем в past
      state.$history.past.push(state.resolve(next));

      // откатываемся на будущее
      isApply = true;
      state.mutate(next);
      isApply = false;
    };

    const undo = () => {
      const last = state.$history.past.pop();
      if (!last) return;

      // текущее состояние кладем в future
      state.$history.future.push(state.resolve(last));

      // откатываемся на прошлое
      isApply = true;
      state.mutate(last);
      isApply = false;
    };

    state.$history = {
      past: [],
      future: [],
      limit,
      undo,
      redo,
      clear: () => {
        state.$history.past = [];
        state.$history.future = [];
      },
    };
  };

export default historyPlugin;
