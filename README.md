<div align="center">

[![npm](https://img.shields.io/npm/v/@graph-state/core?style=flat-square)](https://www.npmjs.com/package/@graph-state/core)
![npm type definitions](https://img.shields.io/npm/types/@graph-state/core?style=flat-square)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@graph-state/core?style=flat-square)](https://bundlephobia.com/result?p=@graph-state/core)

<br/>
<br/>
</div>

# 📘 @graph-state - Graph State Manager
**graph-state** is a powerful graph state manager for handling simple to complex applications. The focus is on managing deep dependent data and creating a flexible system for reactive state updates.

## 📚 Contents
- 📦 [Installation](#Installation)
- 🚀 [Quick Start](#-quick-start)
- 📐 [Basic Concepts](#-key-concepts)
    - Graph
    - Graph Key
    - State
- 💻 [Basic Methods](#-working-with-the-api)
    - [mutate](#mutate-method)
    - [resolve](#resolve-method)
    - [subscribe](#subscribe-method)
    - [invalidate](#invalidate-method)
    - [utils](#utilitarian-methods)
- ⚙️ [Plugins](#-plugins)
- 🛠️ [TypeScript Support](#-example-of-using-typescript)

## 📦 Installation
You can install @graph-state using npm or yarn.

```bash
# npm
npm install @graph-state/core @graph-state/react

# yarn
yarn add @graph-state/core @graph-state/react
```

## 🚀 Quick Start.
Вот простой пример, который показывает, как использовать **@graph-state**.


**App.tsx**
```jsx
import { useGraph } from '@graph-state/react'
import { createState } from '@graph-state/core'

const graphState = createState({
  initialState: {
    value: 150
  }
})

const App = () => {
  const [state, setState] = useGraph(graphState, graphState.key)

  return (
    <div>
      <h1>{state.value}</h1>
      <input 
        type="text” 
        value={state.value} 
        onChange={(e) => setState({ value: e.target.value })} 
      />
    </div>
  )
}

export default App
```

## 📐 Key Concepts

The **@graph-state** library uses three key concepts to handle state: **Graph**, **GraphKey**, and **GraphState**. These elements provide flexible state management using a graph data structure.

---

### 🔹 **Graph**
**Graph** is the underlying data structure. Each Graph represents an object with unique identifiers (`_id`) and type (`_type`). Graph is used to represent state, nodes and their relationships.

#### 📘 **Example Graph**
```js
const userGraph = {
  _type: 'User', // Node type
  _id: 'user-123', // Unique identifier
  name: 'John Doe',
  age: 30
};
```

- _type - specifies the Graph type (e.g. User, Post, Product).
- _id - uniquely identifies a particular node.

Graphs can be nested. For example, a User object can contain an array of skills with Skill objects:

```js
const userGraph = {
    _type: 'User',
    _id: 'user-123',
    name: 'John Doe',
    skills: [
        { _type: 'Skill', _id: 'js', level: 90 }
        { _type: 'Skill', _id: 'ts', level: 80 }
    ]
};
```

### 🔹 GraphKey
**GraphKey** is a string representation that is used to identify a Graph. The GraphKey is created automatically based on the values of **_type** and **_id**.

#### 📘 GraphKey Format
```shell
_type:_id
```

#### 📘 GraphKey example
For a User object with _type: 'User' and _id: 'user-123':

```js
const graphKey = 'User:user-123';
```

GraphKey is used to reference between Graphs and ensure uniqueness of nodes. For example, the skills array can contain references to other Graphs:

```js
const userGraph = {
  _type: 'User',
  _id: 'user-123',
  skills: ['Skill:js', 'Skill:ts'].
};
```

## 🔹 GraphState

**GraphState** is a manager for managing state. It is a “smart” Graph that contains methods for modifying, subscribing to, and retrieving data from other Graphs. It can also contain nested GraphStates, which allows you to create hierarchical state structures.

### 📘 Features of GraphState
1. **GraphState is a Graph**:
    - It has _type and _id fields, making it part of the overall graph system.
    - One GraphState can be nested within another GraphState.
2. **State Isolation**:
    - Each GraphState manages its own graph, including nested nodes and GraphStates.
    - Nested GraphStates create isolated state regions that can be modified independently.

### 📘 Example of creating a GraphState
```js
import { createState } from '@graph-state/core';

const graphState = createState({
  _type: 'State',
  _id: 'main-state',
  initialState: {
    user: { _type: 'User', _id: 'user-123', name: 'John Doe' },
    posts: [
      { _type: 'Post', _id: 'post-1', title: 'My First Post' }
      { _type: 'Post', _id: 'post-2', title: 'Graph-based State Management' }
    ]
  }
});
```

### 📘 Nested GraphState
A GraphState can contain other GraphStates. This allows complex hierarchical state systems to be built:

```js
const nestedState = createState({
  _type: 'State',
  _id: 'nested-state',
  initialState: {
    tasks: [
      { _type: 'Task', _id: 'task-1', description: 'Learn GraphState' }
    ]
  }
});

const mainState = createState({
  _type: 'State',
  _id: 'main-state',
  initialState: {
    nested: nestedState, // Nested GraphState
    user: { _type: 'User', _id: 'user-123', name: 'John Doe' }
  }
});
```

### 📘 Storing non-serializable data
GraphState can store classes, jsx parts, etc. To do this, you need to specify how
to handle such data.

```js
const graphState = createState({
    initialState: {
        _type: 'User',
        _id: 'user-123',
        name: 'John Doe',
        birthDate: new Date('1990-01-01')
    }
  },
  {
    skip: [(data) => data instanceof Date]
  }
);

// Date is stored in its original form
const user = graphState.resolve('User:user-123');
console.log(user.birthDate instanceof Date); // true
```

### 📘 Retrieving the own state
State stores the relationships between graphs, but since it is a graph itself, it can also
can store a state.

```js
const graphState = createState({
    initialState: {
        version: '1.1.2'
    }
  },
);

const state = graphState.resolve(graphState.key);
console.log(state);
// {
//  version: '1.1.2'
// }
```

## 📖 Working with the API

## `mutate` method
The `mutate` method allows you to modify data within a graph. It supports several call formats including update by key (`GraphKey`), object update, and using functions to conditionally change state.
> **Mutual**: By default, the **`mutate`** method performs a deep merge (deep merge) of a new object with existing graph data.
> - **Objects are merged**: new properties are added and existing properties are updated.
> - **Arrays are expanded**: new items are added to the array, with duplicate items removed unless `{ dedup: false }` is specified.

---

### 🔹 **Method Signatures**

The **`mutate`** method supports the following signatures:

1. **Update graph data**:
   ```javascript
    mutate(updatedGraph)
   ```
   Updates the passed object or data in the graph.
---
2. **UpdateGraph by key**:
   ```javascript
    mutate(graphKey, updatedGraph)
   ```
   Updates graph data using GraphKey.
---
3. **Conditional update via function**
    ```javascript
      mutate(graphKey, (prevGraph) => updatedGraph)
     ```
   Performs a graph update based on the previous state.
---
### 🔹 Usage examples

#### 📘 Example 1: Simple graph update
Updates an object in a graph using its data:

```js
const userGraph = {
    _type: 'User',
    _id: 'user-123',
    name: 'John Doe'
};

graphState.mutate({
    ...userGraph,
    name: 'Jane Doe' // Update user name
});

// Result:
graphState.resolve('User:user-123');
// {
//  _type: 'User',
//  _id: 'user-123',
//  name: 'Jane Doe'
// }
```
---
### 📘 Example 2: Update by key
Updating a graph via GraphKey:

```js
graphState.mutate('User:user-123', {
  name: 'Alex Smith',
  age: 30 // Add a new property
});

// Result:
graphState.resolve('User:user-123');
// {
//  _type: 'User',
//  _id: 'user-123',
//  name: 'Alex Smith',
//  age: 30
// }
```
---
### 📘 Example 3: Conditional update using a function
Using a function to modify a graph based on the previous state:

```js
graphState.mutate('User:user-123', (prev) => ({
  ...prev,
  name: prev.name === 'Alex Smith' ? 'John Doe' : 'Alex Smith'
}));

// Result:
graphState.resolve('User:user-123'); 
// Updated name based on the previous value
```
---
### 📘 Example 4: Object linking
The mutate method allows you to link graphs to each other via references (GraphKey):

```js
graphState.mutate('User:user-123', {
  posts: ['Post:1', 'Post:2'] // Link user to posts
});

// Result:
graphState.resolve('User:user-123');
// {
//  _type: 'User',
//  _id: 'user-123',
//  posts: ['Post:1', 'Post:2'].
// }
```

### 📘 Example 5: Deep merge of nested objects and arrays

Through deep merging:
- Objects are merged: new properties are added and existing properties are updated.
- Arrays are expanded: new elements are added to the array.

```js
const userGraph = {
    _type: 'User',
    _id: 'user-123',
    profile: {
      bio: 'Developer',
      skills: ['JavaScript', 'React'].
    }
};

graphState.mutate('User:user-123', {
    profile: {
      skills: ['TypeScript'] // Add a new element to the array
    }
});

// Result:
graphState.resolve('User:user-123');
// {
//   _type: 'User',
//   _id: 'user-123',
//   profile: {
//    bio: 'Developer', // The bio field is saved.
//    skills: ['JavaScript', 'React', 'TypeScript'] // Array extended
//   }
// }
```

### 📘 Example 6: Managing duplicate references
The mutate method removes duplicate values in arrays by default, but this can be disabled using the **{ dedup: false }** option.

```js
graphState.mutate('User:user-123', {
  posts: ['Post:1', 'Post:1', 'Post:2']
}, { dedup: false });

// Result:
graphState.resolve('User:user-123');
// {
//  _type: 'User',
//  _id: 'user-123',
//  posts: ['Post:1', 'Post:1', 'Post:2'] // Duplicates not removed
// }
```


### 📘 Example 7: Graph replacement
The **`replace`** option in the **`mutate`** method controls how new data replaces existing data in a graph. It provides flexible options for full or partial data replacement, including working with nested graphs.

**📘 Possible values of the replace option:**
1.	**true** - Replaces a top-level graph that is mutable.
```js
graphState.mutate('User:user-123', {
  _type: 'User',
  _id: 'user-123',
  email: 'new.email@example.com'
}, { replace: true });

// Result:
graphState.resolve('User:user-123'); 
// {
//  _type: 'User',
//  _id: 'user-123',
//  email: 'new.email@example.com' // All previous fields removed
// }
```
2. Function **(graph) => boolean** - Allows you to decide point by point which graphs to replace.
```js
graphState.mutate('User:user-123', {
  profile: {
    _type: 'Profile',
    _id: 'profile-456',
    bio: 'Updated bio'
  }
}, { 
  replace: (graph) => graph._type === 'Profile' // Replace only graphs of type 'Profile'
});

// Result:
graphState.resolve('User:user-123'); 
// {
//  _type: 'User',
//  _id: 'user-123',
//  profile: {
//    _type: 'Profile',
//    _id: 'profile-456',
//    bio: 'Updated bio' // The “Profile” type graph has been replaced completely
//  }
// }
```
3.	**'deep'** - Applies full replacement to all nested graphs.
```js
graphState.mutate('User:user-123', {
  profile: {
    _type: 'Profile',
    _id: 'profile-456',
    bio: 'Updated bio'
  },
  settings: {
    _type: 'Settings',
    _id: 'settings-789',
    theme: 'dark'
  }
}, { replace: 'deep' });

// Result:
graphState.resolve('User:user-123');
// {
//  _type: 'User',
//  _id: 'user-123',
//  profile: {
//    _type: 'Profile',
//    _id: 'profile-456',
//    bio: 'Updated bio' // Full replacement
//  },
//  settings: {
//    _type: 'Settings',
//    _id: 'settings-789',
//    theme: 'dark' // Full Substitution
//  }
// }
```



## `resolve` method

The **`resolve`** method is used to retrieve data (graph) from storage. It retrieves the graph by key or object containing `_type` and `_id`.

---

### 📘 Parameters
1. **graphKey** - a string in the format Type:Unique_ID, e.g. User:user-123. You can also pass an object with _type and _id fields to identify the graph.
2. options (optional):
    - **deep (boolean)** - If true, the method will dissect all nested graphs. The default is false.
    - **safe (boolean)** - If true and no graph is found, the method will return the argument passed as graphKey. The default is false.

---
### 🔹 Usage examples
**📘 Example 1**: Reading a graph and using safe
Retrieve a graph using a string key (GraphKey) or an object with _type and _id fields. If no graph is found, the safe option can be used to return the passed argument.

```js
// The graph in the repository:
const userGraph = {
    _type: 'User',
    _id: 'user-123',
    name: 'John Doe',
    age: 30
};

// Retrieve the graph by key:
const result1 = graphState.resolve('User:user-123');
console.log(result1);

// Result:
{
    _type: 'User',
    _id: 'user-123',
    name: 'John Doe',
    age: 30
}

// Retrieve the graph by object:
const result2 = graphState.resolve({ _type: 'User', _id: 'user-123' });
console.log(result2);

// Result:
{
    _type: 'User',
    _id: 'user-123',
    name: 'John Doe',
    age: 30
}

// Use `safe` if the graph is not found:
const result3 = graphState.resolve('User:non-existent', { safe: true });
console.log(result3);

// Result:
'User:non-existent'
```

📘 **Example 2**: Using the deep option
If a graph contains nested graphs (links to other graphs), the deep option allows you to dissect them (extract their contents).

```js
// Graph in storage:
graphState.mutate({
  _type: 'User',
  _id: 'user-123',
  name: 'John Doe',
  posts: [
    {
      _type: 'Post',
      _id: '1',
      title: 'My First Post'
    }, 
    {
      _type: 'Post',
      _id: '2',
      title: 'Graph-based State Management'
    }
  ]
});

// Extract the graph with a dissection of nested graphs:
const result = graphState.resolve('User:user-123', { deep: true });
console.log(result);

// Result:
{
  _type: 'User',
  _id: 'user-123',
  name: 'John Doe',
  posts: [
    { _type: 'Post', _id: '1', title: 'My First Post' }
    { _type: 'Post', _id: '2', title: 'Graph-based State Management' }, 
  ]
}
```

**Important:** Without including deep the method will only return references to nested graphs:

```js
const result = graphState.resolve('User:user-123');
console.log(result);

// Result:
{
  _type: 'User',
  _id: 'user-123',
  name: 'John Doe',
  posts: ['Post:1', 'Post:2']
}
```


## `subscribe` method

The **`subscribe`** method is used to subscribe to changes of graphs in the repository. It allows you to track changes to a specific graph or the entire state (if no graph is specified).

---

### 🔹 **Method Signature**

```typescript
subscribe(
  graphKey?: string | { _type: string; _id: string },
  callback: (newValue: Graph, oldValue: Graph) => void,
  options? { signal?: AbortSignal }
): () => void
```

### 🔹 Usage examples

**📘 Example 1**: Subscribing and unsubscribing using a function
Subscribe and unsubscribe for changes to a particular graph using a function:

```js
graphState.subscribe('User:user-123', (newValue, oldValue) => {
    console.log('Graph changed:');
    console.log('Old value:', oldValue);
    console.log('New value:', newValue);
});

// An example of graph modification:
graphState.mutate('User:user-123', { name: 'Jane Doe' });

// Logs:
The graph has been modified:
Old value: { _type: 'User', _id: 'user-123', name: 'John Doe', age: 30 }
New value: { _type: 'User', _id: 'user-123', name: 'Jane Doe', age: 30 }

```

### 📘 Example 2: Subscribing to whole state changes
If the graphKey parameter is not specified, the method subscribes to all changes in the repository. Colback will be called for each graph that is changed.

```js
graphState.subscribe((newValue, oldValue) => {
  console.log('Graph changed:');
  console.log('Old value:', oldValue);
  console.log('New value:', newValue);
});

// Example of a change:
graphState.mutate('User:user-123', { name: 'Alex Smith' });
graphState.mutate('Post:1', { title: 'Updated Post Title' });

// Logs:
Graph modified: { old value: { _type: 'User', _id: 'user-123', name: 'Jane Doe', age: 30 }
New value: { _type: 'User', _id: 'user-123', name: 'Alex Smith', age: 30 }
  
Old value: { _type: 'Post', _id: '1', title: 'My First Post' }
New value: { _type: 'Post', _id: '1', title: 'Updated Post Title' }

```

### 📘 Example 3: Subscribe and unsubscribe
You can use the AbortController to manage subscriptions. This is useful in situations where subscription is related to the lifecycle of a component or process.

```js
const controller = new AbortController();

const unsubscribe = graphState.subscribe(
    'User:user-123',
    (newValue, oldValue) => {
        console.log('Graph changed:');
        console.log('Old value:', oldValue);
        console.log('New value:', newValue);
    },
    { signal: controller.signal }
);

// Example of graph mutate:
graphState.mutate('User:user-123', { name: 'Alex Smith' });

// Logs:
Graph modified:
Old value: { _type: 'User', _id: 'user-123', name: 'Jane Doe', age: 30 }
New value: { _type: 'User', _id: 'user-123', name: 'Alex Smith', age: 30 }

// Cancel subscription:
controller.abort();
// or unsubscribe();
```


## `invalidate` method
The **`invalidate`** method is used to remove graphs from the repository. It manages both the graph itself and the relationships in which that graph participates.

---

### 🔹 **Method Signature**

```typescript
invalidate(graphKey: string | { _type: string; _id: string }): void
```

### 🔹 Peculiarities of invalidate operation
1.	**Deletion of graphs**: The method removes the specified graph from the storage.
2.	**Update references in objects**: If the graph is the value of any key in the object, its value is replaced with null.
3.	**Update references in arrays**: If a graph is used in an array, it is removed from that array.
4.	**Cascading deletion**: If the graph being deleted has “children” (graphs that only reference this graph), they are also deleted.
5.	**Non-obvious way to delete a graph**: If a graph loses all dependencies (i.e. it is no longer used anywhere), it is automatically removed from the repository. This can be done using the mutate method by removing references to the graph from other graphs.

### 🔹 Usage examples

#### 📘 Example 1: Removing a graph used in an object
If the graph is the value of any key of an object, the value is replaced by null after it is deleted.

```js
// Initial state:
graphState.mutate({
    _type: 'User',
    _id: 'user-123',
    profile: {
        _type: 'Profile',
        _id: '456',
        bio: 'Developer'
    }
});

// Delete the “Profile:456” graph:
graphState.invalidate('Profile:456');

// Result:
graphState.resolve('User:user-123');
// {
//  _type: 'User',
//  _id: 'user-123',
//  profile: null // The reference to the deleted graph is replaced by null
// }
```

#### 📘 Example 2: Deleting a graph used in an array
If a graph is used in an array, it is removed from the array.

```js
// Initial state:
graphState.mutate({
  _type: 'User',
  _id: 'user-123',
  posts: [
    {
        _type: 'Post',
        _id: '1',
        title: 'First Post'
    },
    {
        _type: 'Post',
        _id: '2',
        title: 'Second Post'
    }
  ]
})

// Delete the graph “Post:1”:
graphState.invalidate('Post:1')

// Result:
graphState.resolve('User:user-123')
// {
//  _type: 'User',
//  _id: 'user-123',
//  posts: ['Post:2'] // “Post:1” removed from the array
// }
```

#### 📘 Example 3: Cascading graph deletion
If the graph to be deleted has “children” (graphs referring only to it), they are also deleted.

```js
// Initial state:
graphState.mutate({
    _type: 'User',
    _id: 'user-123',
    profile: 'Profile:456'
});

graphState.mutate({
    _type: 'Profile',
    _id: '456',
    bio: 'Developer',
    skills: [{
        _type: 'Skill',
        _id: '1',
        name: 'JavaScript'
    }, {
        _type: 'Skill',
        _id: '2',
        name: 'TypeScript'
    }]
});

// Delete the “Profile:456” graph:
graphState.invalidate('Profile:456');

// Result:
graphState.resolve('User:user-123');
// {
//  _type: 'User',
//  _id: 'user-123',
//  profile: null // The reference to the deleted graph is replaced by null
// }

// The “Skill:1” and “Skill:2” graphs are also removed, as they only reference “Profile:456”.
graphState.resolve('Skill:1'); // null
graphState.resolve('Skill:2'); // null
```

#### 📘 Example 4: Remove graph by Garbage Collector
If a graph loses all dependencies, it is automatically deleted. This can be done by removing references to the graph via the mutate method.

```js
// Initial state:
graphState.mutate({
  _type: 'User',
  _id: 'user-123',
  profile: {
    _type: 'Profile',
    _id: '456',
    bio: 'Developer'
  }
});

// Remove the reference to the “Profile:456” graph:
graphState.mutate('User:user-123', { profile: null });

// Result:
graphState.resolve('User:user-123');
// {
//  _type: 'User',
//  _id: 'user-123',
//  profile: null // Link removed
// }

// Since graph “Profile:456” no longer has any dependencies, it is automatically removed:
graphState.resolve('Profile:456'); // undefined
```


## Utilitarian methods
Utilitarian methods provide additional functions for convenient work with graphs, their keys, and auxiliary operations.

---

### 🔹 **`safeResolve`**.
The **`safeResolve`** method is a simplified version of the **`resolve`** method, which always returns the passed `graphKey` or object if no graph is found.

#### 📘 **Signature**
```typescript
safeResolve(graphKey: string | { _type: string; _id: string }): Graph | string | string | { _type: string; _id: string }
```

#### 📘 Example
```js
const result = graphState.safeResolve('User:non-existent');

// Result:
'User:non-existent'.

const result2 = graphState.safeResolve({ _type: 'User', _id: 'non-existent' });

// Result:
{ _type: 'User', _id: 'non-existent' }
```

---

### 🔹 resolveParents
The resolveParents method returns all graphs that use the requested graph. This is useful for analyzing dependencies.

#### 📘 **Signature**
```typescript
resolveParents(graphKey: string | { _type: string; _id: string }): Graph[]
```

#### 📘 Example
```js
// Initial state:
graphState.mutate({
  _type: 'User',
  _id: 'user-123',
  posts: [{
    _type: 'Post',
    _id: '1',
    title: 'My First Post'
  }]
});


// Let's find all graphs that use 'Post:1':
const parents = graphState.resolveParents('Post:1');
console.log(parents);

// Result:
[
  {
    _type: 'User',
    _id: 'user-123',
    posts: ['Post:1']
  }
]
```

---

### 🔹 inspectFields
The inspectFields method returns all graphs of a certain type.

#### 📘 **Signature**
```typescript
inspectFields(_type: string): Graph[]
```

#### 📘 Example
```js
// Initial state:
graphState.mutate({
  _type: 'User',
  _id: 'user-123',
  name: 'John Doe'
});

graphState.mutate({
  _type: 'User',
  _id: 'user-456',
  name: 'Jane Doe'
});

// Get all graphs of type “User”:
const users = graphState.inspectFields('User');
console.log(users);

// Result:
[
  {
    _type: 'User',
    _id: 'user-123',
    name: 'John Doe'
  },
  {
    _type: 'User',
    _id: 'user-456',
    name: 'Jane Doe'
  }
]
```

---

### 🔹 keyOfEntity
The keyOfEntity method constructs a graphKey from an object containing _type and _id.

#### 📘 **Signature**
```typescript
keyOfEntity(entity: { _type: string; _id: string }): string
```

#### 📘 Example
```js
const key = graphState.keyOfEntity({ _type: 'User', _id: 'user-123' });
console.log(key);

// Result:
'User:user-123'
```

---

### 🔹 entityOfKey
The entityOfKey method constructs an object from graphKey.

#### 📘 **Signature**
```typescript
entityOfKey(graphKey: string): { _type: string; _id: string }
```

#### 📘 Example
```js
const entity = graphState.entityOfKey('User:user-123');
console.log(entity);

// Result:
{
  _type: 'User',
    _id: 'user-123'
}
```

---

### 🔹 getArgumentsForMutate
The getArgumentsForMutate method handles overloads of the mutate method and returns a standard object with arguments.

#### 📘 **Signature**
```typescript
getArgumentsForMutate(
  graphKeyOrEntity: string | { _type: string; _id: string } | Graph,
  data?: Graph,
  options? { replace?: boolean | ((graph: Graph) => boolean) | 'deep'; dedup?: boolean }
): { graphKey: string; data: Graph; options: { replace?: boolean; dedup?: boolean } } }
```

#### 📘 Example
```js
const args = graphState.getArgumentsForMutate('User:user-123', { name: 'Jane Doe' });
console.log(args);

// Result:
{
  graphKey: 'User:user-123',
    data: { name: 'Jane Doe' },
  options: {}
}

// Using an object:
const args2 = graphState.getArgumentsForMutate(
  { _type: 'User', _id: 'user-123' }
  { name: 'Jane Doe' }
  { replace: true }
);
console.log(args2);

// Result:
{
  graphKey: 'User:user-123',
    data: { name: 'Jane Doe' },
  options: { replace: true }
}
```



# 📖 Plugins

The plugin system allows you to extend the functionality of the state by modifying the original methods, adding new ones, or introducing logic that affects API calls. Plugins can also modify the state object itself.

---

## 🔹 **Signature of plugins**

Plugins have the following signature:

```typescript
type Plugin = (
  state: GraphState,
  { mutateOverride }: { mutateOverride: (next: Function, ...args: any[]) => any }
) => void | GraphState;
```

### 🔹 Usage examples

📘 Example 1: Plugin for mutate logging.
A simple plugin that logs all mutate calls.

```js
const loggingPlugin = (state, { mutateOverride }) => {
  mutateOverride((next, ...args) => {
    console.log('Until mutate is called:', args);
    const result = next(...args);
    console.log('After calling mutate:', result);
    return result;
  });
};

const graphState = createState({}, { plugins: [loggingPlugin] });

graphState.mutate('User:user-123', { _type: 'User', _id: 'user-123', name: 'John Doe' });
// Logs:
// Before mutate was called: ['User:user-123', { _type: 'User', _id: 'user-123', name: 'John Doe' }, {}]
// After calling mutate: { _type: 'User', _id: 'user-123', name: 'John Doe' }
```

📘 Example 2: A plugin that adds new methods

```js
const fetchPlugin = (state) => {
  // Add a new fetch method to the state object
  state.fetch = async function (graphKey, fetcher) {
    console.log(`Query graph ${graphKey}...`);

    // Execute the query using the passed fetcher
    const data = await fetcher(graphKey);

    if (!data || !data._type || !data._id) {
      throw new Error(`Invalid data for graph ${graphKey}`);
    }

    // Add the graph to the state via mutate
    this.mutate(graphKey, data);
    console.log(`Graph ${graphKey} was successfully added to the repository`);

    return data;
  };

  return state; // Return the modified state object
};

// Example of using the plugin
const graphState = createState({}, { plugins: [fetchPlugin] });

// Example of fetcher function
const mockFetcher = async (graphKey) => {
  const mockData = {
    'User:user-123': { _type: 'User', _id: 'user-123', name: 'John Doe' },
    'Post:post-1': { _type: 'Post', _id: 'post-1', title: 'My First Post' }
  };
  return new Promise((resolve) => setTimeout((() => resolve(mockData[graphKey]), 500));
};

// Using the fetch method
(async () => {
  try {
    const user = await graphState.fetch('User:user-123', mockFetcher);
    console.log('Fetched data:', user);

    // Check that the graph has been added to the state
    const resolvedUser = graphState.resolve('User:user-123');
    console.log('Graph from storage:', resolvedUser);
  } catch (error) {
    console.error(error);
  }
})();
```

# 📖 Working with TypeScript

The **@graph-state** library fully supports **TypeScript**, which allows you to work with typed data in a safe and convenient way. You can define types for graphs, providing strict type checking when working with state methods.

---

## 🔹 **Example of using TypeScript**

```typescript
import { createState } from '@graph-state/core';

interface User {
  _type: 'User'; // For versions of TypeScript below 5.0, add `as const`
  age: number;
}

interface Post {
  _type: 'Post';
  text: string;
}

const state = createState<User | Post>({
  initialState: {
    value: 'hello' // Incorrect, because it does not correspond to User or Post types
  }
});

// Extracting data via resolve
const user = state.resolve('User:100'); // Type: User | undefined
const post = state.resolve({ _type: 'Post' }); // Type: Post | undefined
const unknownGraph = state.resolve({ _type: 'Layer' }); // Type: unknown

// Data modification via mutate
state.mutate('User:100', {
  age: 20, // Correct
  name: 'test' // Error: The `name` field is missing in the `User` type
});
```
