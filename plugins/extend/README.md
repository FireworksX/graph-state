# @graph-state/plugin-ws

> Plugin for connect socket server to @graph-state. Work with Socket.io and WebSocket.

## Installation

```sh
npm i @graph-state/core @graph-state/plugin-ws
```

or

```sh
yarn add @graph-state/core @graph-state/plugin-ws
```

## Get started

```jsx
import io from 'socket.io-client';
import { createState } from '@graph-state/core';
import wsPlugin from '@graph-state/plugin-ws';

// Create socket
const socket = io('path to server');

// Apply plugin
export const graphState = createState({
  plugins: [
    wsPlugin(socket),
  ],
});


```

Now each event from socket will populate graphState. Server acts as source of truth.
For mutations server need return **graph-based object**.

### Example server response

```jsx
// server

// That emit update User graph or create new
io.emit('anyEventName', {
  _type: 'User',
  _id: 'userId',
  name: 'testUser'
})

```

#### WebSocket server response
```jsx
socket.send(JSON.stringify({
  eventName: 'anyEventName',
  data: {
    _type: 'User',
    _id: 'userId',
    name: 'testUser'
  }
}))
```


### Transforms

If you use socket server which you can control and adaptive server response. Use **transforms**.

```jsx
import { isGraph } from '@graph-state/core'

export const graphState = createState({
  plugins: [
    wsPlugin(socket, {
      transforms: {
        eventName(cache, value) {
          // You can modify input event

          if (!isGraph(value)) {
            // Return graph
            return {
              _type: 'User',
              _id: 'userId', // Attention!! Dot't generate id inside transform.
              anyData: 'data'
            }
          }
          
          return null
        }
      }
    }),
  ],
});

```

> Don't generate id inside transform because socket server is alone 
> but many clients and **each client had uniq id for self session**.
> You can build uniq key by incoming data.

```js
wsPlugin(socket,
  {
    transforms: {
      eventName(cache, value) {
        if (!isGraph(value)) {
          return {
            _type: 'User',
            _id: `user-${someUniqFields}`,
            anyData: 'data'
          }
        }

        return null
      }
    }
  }),
```

### Effects
Effect need for side effects of events.

```jsx
export const graphState = createState({
  plugins: [
    wsPlugin(socket, {
      effects: {
        eventName(cache, value) {
          // do somithing
          cache.invalidate('User:userId')
        }
      }
    }),
  ],
});
```
