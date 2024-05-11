import io from 'socket.io-client';
import { useState } from 'react';
import { Chat } from './Chat';
import { createState } from '@graph-state/core';
import { GraphValue, useGraph, useGraphFields } from '@graph-state/react';
import { Message } from './Message';

export const socket = io('http://localhost:5400', {
  transports: ['websocket'],
});

const socketIOPlugin = socket => graphState => {
  console.log(graphState);

  socket.onAny((eventName: string, value: any) => {
    if (typeof value === 'object') {
      graphState.mutate(value);
    }
  });
};

export const generateId = () => Math.random().toString(16).slice(2);

export const me = {
  _type: 'User',
  id: generateId(),
  name: null,
};

export const graphState = createState({
  // initialState: {
  //   _type: 'Message',
  //   id: getId(),
  //   content: 'Hello',
  //   user: userOne,
  // },
  plugins: [socketIOPlugin(socket)],
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
