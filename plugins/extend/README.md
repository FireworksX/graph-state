# @graph-state/plugin-ws

> Plugin for extend Graph. May use like computed.

## Installation

```sh
npm i @graph-state/core @graph-state/plugin-extend
```

or

```sh
yarn add @graph-state/core @graph-state/plugin-extend
```

## Get started

```jsx
import { createState } from '@graph-state/core';
import extendPlugin from '@graph-state/plugin-extend';

export const graphState = createState({
  plugins: [
    extendPlugin({
      User: (cache, graph) => {
        return {
          ...graph,
          someProp: 'test'
        }
      }
    }),
  ],
});

graphState.mutate({
  _type: 'User',
  _id: 'id'
})

graphState.resolve('User:id')
/**
 * _type: 'User',
 * _id: 'id'
 * someProp: 'test'
 */
```

## Extend method
Plugin append new method to GraphState instance

```jsx
export const graphState = createState({
  plugins: [extendPlugin()],
});

graphState.extendGraph('User:test', (cache, graph) => graph)

```
