import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';

export const generateId = () => Math.random().toString(16).slice(2);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {});

const subscribers = new Map();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (_req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

const subscribe = (id: string, userGraph: any) => {
  subscribers.set(id, userGraph);
  console.log(`Connected to ${id}.`);
};

const unsubscribe = (id: string) => {
  subscribers.delete(id);
  console.log(`Disconnected from ${id}.`);
};

io.on('connection', socket => {
  const id = socket.id;

  socket.on('disconnect', () => {
    io.emit('chatMessage', {
      _type: 'Message',
      _id: generateId(),
      kind: 'logout',
      user: subscribers.get(id),
    });
    unsubscribe(id);
  });

  socket.on('chatMessage', (message: string) => {
    io.emit('chatMessage', message);
  });

  socket.on('safeRemoveMessage', (messageId: string) => {
    io.emit('safeRemoveMessage', {
      _type: 'Message',
      _id: messageId,
      removed: true,
    });
  });

  socket.on('removeMessage', (messageId: string) => {
    io.emit('removeMessage', {
      _type: 'Message',
      _id: messageId,
    });
  });

  socket.on('updateMessage', (messageId: string, newContent: string) => {
    io.emit('updateMessage', {
      _type: 'Message',
      _id: messageId,
      content: newContent,
      date: new Date().toISOString(),
    });
  });

  socket.on('login', (userGraph: any) => {
    subscribe(id, userGraph);
    io.emit('chatMessage', {
      _type: 'Message',
      _id: generateId(),
      kind: 'login',
      user: userGraph,
    });
  });
});

const port = 5400;

httpServer.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
});
