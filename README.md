<div align="center">

[![npm](https://img.shields.io/npm/v/@graph-state/core?style=flat-square)](https://www.npmjs.com/package/@mozaikjs/core)
![npm type definitions](https://img.shields.io/npm/types/@graph-state/core?style=flat-square)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@graph-state/core?style=flat-square)](https://bundlephobia.com/result?p=@mozaikjs/core)

<br/>
<br/>
</div>

# @graph-state


> graph-state is **graph based** state manager, designed for both simple and complex applications.

## Packages

| Package                                                                               | Version                                                                                                                  | Docs                                                                                                      | Size                                                                                                                                                  |
|---------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@graph-state/core`](https://github.com/FireworksX/graph-state/tree/master/packages/core#readme) | [![npm](https://img.shields.io/npm/v/@graph-state/core?style=flat-square)](https://www.npmjs.com/package/@graph-state/core) | [![](https://img.shields.io/badge/API%20Docs-markdown-lightgrey.svg?style=flat-square)](/packages/core)   | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@graph-state/core?style=flat-square)](https://bundlephobia.com/result?p=@mozaikjs/core)    |
| [`@graph-state/react`](https://github.com/FireworksX/mozaik/tree/main/packages/react/#readme)    | [![npm](https://img.shields.io/npm/v/@graph-state/react?style=flat-square)](https://www.npmjs.com/package/@graph-state/react)   | [![](https://img.shields.io/badge/API%20Docs-markdown-lightgrey.svg?style=flat-square)](/packages/react)  | [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@graph-state/react?style=flat-square)](https://bundlephobia.com/result?p=@mozaiks/react)   |

## Examples

- Base functional [CodeSandbox](https://codesandbox.io/p/live/1755c979-5ca2-4672-b7e2-10738677a72b)

## Get started


### Install

```sh
npm i @graph-state/core @graph-state/react
```

or

```sh
yarn add @graph-state/core @graph-state/react
```

### Usage

**App.tsx**

```jsx
import { useGraph } from '@graph-state/react'
import { createState } from '@graph-state/core'

const grapState = createState({
  initialState: {
    _type: 'Node',
    _id: 'ID',
    value: 150
  }
})

const App = () => {
  const nodeValue = useGraph(grapState, 'Node:ID')

  return <h1>{nodeValue.value}</h1>
}
```

## Concept

Graph state had few abstractions

- **Graph** - payload of state, as atom. Required `_type` field.
- **Graph key** - its string as `_type:_id` of graph
- **State** - graph manager. It`s a **graph**. You can create compositions with nested **states** which had isolate scope of graphs

---

## Graph
Is plain object with `_type`
```jsx
const baseGraph = {
  _type: 'Graph',
  _id: 'any uniq id' // if don`t passed, will be generate uniq key
}
```

## State
Is a manager of graphs with reactive updates.

```jsx
import { createState } from '@graph-state/core'

const graphState = createState()

console.log(graphState)
/**
 * _id: 'State uniq id'
 * _type: 'Instance'
 * ...other methods
 */
```

### State mutate method
Signature

- `mutate(updatedGraph)`
- `mutate(graphKey, updatedGraph)`
- `mutate(graphKey, (prevGraph) => updatedGrap)`

```jsx
import { createState } from '@graph-state/core'

const graphState = createState()

const user = {
  _type: 'User',
  _id: 'usernameOne',
  name: 'James'
}

graphState.mutate(user)

// Now graphState has user, you can read him
graphState.resolve(user).name // James

// Change name
graphState.mutate({
  ...user,
  name: 'Not James'
})
graphState.resolve(user).name // Not James

// Change by key
graphState.mutate('User:usernameOne', {
  name: 'Alie',
  gender: 'female' // Add new property
})

graphState.resolve(user)
/**
 * _type: 'User'
 * _id: 'usernameOne'
 * name: 'James'
 * gender: 'female'
 */

// Mutate with conditional
graphState.mutate('User:usernameOne', prev => ({
  someProp: prev.gender === 'female' ? 'value one' : 'value two'
}))

```

> By default, state merging on top level. Merge objects and arrays. You don`t need spread every update.

---

### State resolve value and inspect fields
```jsx
import { createState } from '@graph-state/core'

const userOne = {
  _type: 'User',
  _id: 'id',
  name: 'James'
}

const userTwo = {
  _type: 'User',
  _id: 'id2',
  name: 'Barb'
}
const graphState = createState({initialState: [userOne, userTwo]})

graphState.resolve(userOne).name // James
graphState.resolve('User:id2').name // Barb

graphState.inspectFields('User')
/**
 * User:id
 * User:id2
 */


```

### Observe updates

#### Simple variant
```jsx

import { createState } from '@graph-state/core'

const userGraph = {
  _type: 'User',
  _id: 'id',
  name: 'James'
}

const graphState = createState({initialState: userGraph})

graphState.subscribe(userGraph, (nextState) => {
  /**
   * _type
   * _id
   * name: Stef
   */
})

graphState.mutate({
  ...userGraph,
  name: 'Stef'
})


```

#### Nested graph

```jsx
import { createState } from '@graph-state/core'

const user = {
  _type: 'User',
  _id: 'id',
  name: 'Vlad'
}

const post = {
  _type: 'Post',
  _id: 'id',
  title: 'Some post title',
  auhtor: user
}

const graphState = createState({initialState: post})

graphState.subscribe(user, (nextState) => {
  /**
   * user will be updated if parent was chnaged
   * 
   * _type
   * _id
   * name: Stef
   */
})

graphState.mutate({
  ...post,
  title: 'Some different title'
})
```

#### Nested graph state

An example above we create nested graph. You can use any nested 
level for your state. Inside state will be created link for graphs.
```yaml
Document
  posts
    post (_id one)
      author (_id someUser)
    post
      author (_id otherUser)
    post
      author (_id someUser) // Same user
```

You can mutate user in one place and him will update in all posts.


## Plugins

```jsx
import { createState } from '@graph-state/core'

const loggerPlugin = (graphState) => {
  const originalMutate = graphState.mutate
  
  graphState.mutate = (...args) => {
    const {entityKey, data} = getArgumentsForMutate(...args)

    console.log(`Graph ${entityKey} was updated.`)
    originalMutate(...args)
  }
}

const graphState = createState({
  plugins: [loggerPlugin]
})

```


## Utility 

#### keyOfEntity
```js
import {keyOfEntity} from '@graph-state'

keyOfEntity({
  _type: 'User',
  _id: 'id'
}) // User:id
```

#### entityOfKey
```js
import {entityOfKey} from '@graph-state'

entityOfKey('User:id')
/**
 * _type: 'User',
 * _id: 'id'
 */
```
