import type { Entity, GraphState, Plugin } from '@graph-state/core';
import { isGraph } from '@graph-state/core';

type Transform = (cache: GraphState, ...args: unknown[]) => Entity;

type Effect = (cache: GraphState, ...args: unknown[]) => void;

interface WebSocketEvent {
  eventName: string;
  data: unknown;
}

interface WsOptions {
  transforms?: Record<string, Transform>;
  effects?: Record<string, Effect>;
}

interface WebSocket {
  addEventListener(eventName: string, event: any): void;
}

interface SocketIO {
  onAny(...args: any[]): void;
}

const wsPlugin: (socket: SocketIO | WebSocket, options?: WsOptions) => Plugin =
  (socket, options) => graphState => {
    const transforms = options?.transforms ?? {};
    const effects = options?.effects ?? {};

    const applyState = (eventName: string, ...args: unknown[]) => {
      const transform = transforms[eventName];
      const effect = effects[eventName];
      const nextValue = transform ? transform(graphState, ...args) : args[0];

      if (isGraph(nextValue)) {
        graphState.mutate(nextValue);
      } else {
        console.warn(
          `[graph-state-ws]: Skip apply state for ${eventName}. Because got not Graph.`,
          nextValue
        );
      }

      if (effect) {
        effect(graphState, ...args);
      }
    };

    if ('onAny' in socket) {
      socket.onAny((eventName: string, ...args: unknown[]) =>
        applyState(eventName, ...args)
      );
    }

    if (socket instanceof WebSocket) {
      socket.addEventListener('message', event => {
        const parsedEvent = JSON.parse(event.data) as WebSocketEvent;
        if (parsedEvent.eventName && parsedEvent.data) {
          applyState(parsedEvent.eventName, parsedEvent.data);
        }
      });
    }

    return graphState;
  };

export default wsPlugin;
