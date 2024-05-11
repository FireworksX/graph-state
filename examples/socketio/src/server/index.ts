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

const subscribe = (id: string, socket: any) => {
  subscribers.set(id, socket);
  console.log(`Connected to ${id}.`);
};

const unsubscribe = (id: string) => {
  subscribers.delete(id);
  console.log(`Disconnected from ${id}.`);
};

io.on('connection', socket => {
  const id = socket.handshake.headers.origin as any;
  subscribe(id, socket);

  socket.on('disconnect', () => {
    unsubscribe(id);
  });

  socket.on('chatMessage', (message: string) => {
    io.emit('chatMessage', {
      _type: 'Message',
      _id: generateId(),
      content: message,
    });
  });
});

const port = 5400;

httpServer.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
});
