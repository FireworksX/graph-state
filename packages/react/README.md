# @graph-state/react

> Bindings for react apps.

## Installation

```sh
npm i @graph-state/core @graph-state/react
```

or

```sh
yarn add @graph-state/core @graph-state/react
```

## Get started

```jsx
import { createState } from '@graph-state/core';

export const graphState = createState({
  initialState: {
    version: 1,
    user: {
      _type: 'User',
      _id: 'id',
      age: 23
    }
  }
});
```

```jsx
// App.tsx
import { useGraph } from '@graph-state/react';

const App = () => {
  const [state, updateState] = useGraph(graphState)
  const [user, updateUser] = useGraph(graphState, 'User:id')
  
  return <div>
    <h2>Version: {state.version}</h2>
    <h2>Age: {user.age}</h2>
    <button onClick={() => updateUser({age: Math.random() * 100})}>Update age</button>
  </div>
}
```

## `useGraph(graphState, entity)`

A React hook that returns a tuple `[value, setter]`, similar to the `useState` React hook.

### Parameters
- **graphState**: Instance of graph manager state.
- **entity**: The key of the graph entity that we subscribe and mutate.

### Returns
`useGraph` returns an array with exactly two values:

- The current value of the graph in the state. 
- The set function that lets you update the value to a different value and trigger a re-render.

## `useGraphFields`

Hook return array links of types
### Parameters
- **graphState**: Instance of graph manager state.
- **entityType**: The type of entity. Example: _User_

### Returns
`useGraphFields` returns an array links of type


## `useGraphStack`

Hook return array links of types
### Parameters
- **graphState**: Instance of graph manager state.
- **entities**: Array of links.

### Returns
`useGraphStack` returns an array of graphs.

```jsx
// App.tsx
import { useGraphFields, useGraphStack } from '@graph-state/react';

const App = () => {
  const allUserLinks = useGraphFields(graphState, 'User') // [User:id]
  const users = useGraphStack(graphState, allUserLinks)
  
  return <div>
    <h2>Ages:</h2>
    <ul>
      {users.map(user => <li>{user.age}</li>)}
    </ul>
  </div>
}
```

## `GraphValue`
Helper component for declarative reactions.

```jsx
import { useGraph, GraphValue } from '@graph-state/react';
import { graphState } from './App'

const App = () => <div>
  <GraphValue graphState={graphState} field='User:id'>
    {(user, updateUser) =>
      <>
        <h2>Age: {user.age}</h2>
        <button onClick={() => updateUser({ age: Math.random() * 100 })}>Update age</button>
      </>
    }
  </GraphValue>
</div>
```

## `GraphValues`
Helper component for get declarative graphs.

```jsx
import { useGraphFields, useGraphStack, GraphValues } from '@graph-state/react';
import { graphState } from './App'

const App = () => {
  const allUserLinks = useGraphFields(graphState, 'User') // [User:id]

  return <div>
    <h2>Ages:</h2>
    <ul>
      <GraphValues graphState={graphState} fields={allUserLinks}>
        {(users) => users.map(user => <li>{user.age}</li>)}
      </GraphValues>
    </ul>
  </div>
}
```
