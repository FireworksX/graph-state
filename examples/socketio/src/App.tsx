import io from 'socket.io-client';
import { Chat } from './Chat';
import type { Graph } from '@graph-state/core';
import { createState, isGraph } from '@graph-state/core';
import { useGraphFields } from '@graph-state/react';
import wsPlugin from '@graph-state/plugin-ws';
import { Message } from './Message';

export const socket = io('http://localhost:5400', {
  transports: ['websocket'],
});

export const generateId = () => Math.random().toString(16).slice(2);

export const currentUserID = generateId();

export const graphState = createState({
  plugins: [
    wsPlugin(socket, {
      transforms: {
        chatMessageOld(_cache, message: unknown, user: unknown) {
          if (typeof message === 'string') {
            const timestamp = new Date().getTime();
            return {
              _type: 'Message',
              _id: timestamp,
              kind: 'message',
              content: message,
              user,
              date: new Date().toISOString(),
            } as Graph;
          }

          return null;
        },
      },
      effects: {
        removeMessage(cache, value: any) {
          cache.invalidate(value);
        },
      },
    }),
  ],
});

const App = () => {
  const messages = useGraphFields(graphState, 'Message');

  return (
    <Chat>
      {messages.map(messageKey => (
        <Message key={messageKey} messageKey={messageKey} />
      ))}
    </Chat>
  );
};

export default App;
