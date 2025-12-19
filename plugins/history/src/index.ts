import type { Graph, LinkKey, Plugin } from '@graph-state/core';
import { keyOfEntity } from '@graph-state/core';

interface HistoryEntry {
  linkKey: LinkKey;
  prev: Graph; // Состояние ДО изменения
  next: Graph; // Состояние ПОСЛЕ изменения
  timestamp: number;
}

interface HistoryState {
  past: HistoryEntry[][];
  future: HistoryEntry[][];
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
  (
    limit: number = 50,
    predicate?: (next: Graph, prev: Graph) => boolean
  ): Plugin =>
  state => {
    let isApply = false;
    let currentBatch: HistoryEntry[] = [];
    let batchTimeout: NodeJS.Timeout | null = null;
    const BATCH_DELAY = 50; // ms

    (state as any).subscribe(
      (next: Graph, prev: Graph) => {
        const isAllow = predicate?.(next, prev) ?? true;
        if (!isAllow) {
          return;
        }

        if (!isApply) {
          currentBatch.push({
            next,
            prev,
            timestamp: new Date().getTime(),
            linkKey: keyOfEntity(next ?? prev) ?? '',
          });

          if (batchTimeout) clearTimeout(batchTimeout);

          batchTimeout = setTimeout(() => {
            if (currentBatch.length > 0) {
              // Сохраняем всю группу как один элемент истории
              state.$history.past.push(currentBatch);

              // ограничение длины истории
              if (state.$history.past.length > limit) {
                state.$history.past.shift();
              }

              // сбрасываем redo
              state.$history.future = [];

              currentBatch = [];
            }
          }, BATCH_DELAY);
        }
      },
      {
        directChangesOnly: true,
      }
    );

    const redo = () => {
      const next = state.$history.future.pop();
      if (!next) return;

      isApply = true;
      [...next].forEach((entity: HistoryEntry) => {
        if (!entity.next) {
          state.invalidate(entity.linkKey);
        } else {
          state.mutate(entity.linkKey, entity.next, { replace: true });
        }
      });
      isApply = false;

      state.$history.past.push(next);

      if (state.$history.past.length > limit) {
        state.$history.past.shift();
      }
    };

    const undo = () => {
      const last = state.$history.past.pop();
      if (!last) return;

      isApply = true;
      [...last].reverse().forEach((entity: HistoryEntry) => {
        if (!entity.prev) {
          state.invalidate(entity.linkKey);
        } else {
          state.mutate(entity.linkKey, entity.prev, { replace: true });
        }
      });
      isApply = false;

      state.$history.future.push(last);

      if (state.$history.future.length > limit) {
        state.$history.future.shift();
      }
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
