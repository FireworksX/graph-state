import io from 'socket.io-client';
import { useState } from 'react';
import { Chat } from './Chat';
import { createState } from '@graph-state/core';
import { GraphValue, useGraph, useGraphFields } from '@graph-state/react';
import { Message } from './Message';

export const socket = io('http://localhost:5400', {
  transports: ['websocket'],
});

const socketIOPlugin = (socket, options) => graphState => {
  const transforms = options?.transforms ?? {};
  const effects = options?.effects ?? {};

  socket.onAny((eventName: string, value: any) => {
    const transform = transforms[eventName];
    const effect = effects[eventName];
    const nextValue = transform ? transform(value) : value;

    if (typeof nextValue === 'object') {
      graphState.mutate(nextValue);
    }

    if (effect) {
      effect(nextValue, graphState);
    }
  });
};

export const generateId = () => Math.random().toString(16).slice(2);

export const currentUserID = generateId();

export const graphState = createState({
  plugins: [
    socketIOPlugin(socket, {
      transforms: {
        chatMessage(message: unknown) {
          if (typeof message === 'string') {
            return {
              _type: 'Message',
              _id: generateId(),
              kind: 'message',
              content: message,
              date: new Date().toISOString(),
            };
          }

          return message;
        },
      },
      effects: {
        removeMessage(value, cache) {
          cache.invalidate(value);
        },
      },
    }),
  ],
});

const App = () => {
  const messages = useGraphFields(graphState, 'Message');

  console.log(messages);
  messages.forEach(m => console.log(graphState.resolve(m)));
  return (
    <Chat>
      {messages.map(messageKey => (
        <Message key={messageKey} messageKey={messageKey} />
      ))}
    </Chat>
  );
};

export default App;
