### `useGraph(graphState, entity)`

A React hook that returns a tuple `[value, setter]`, similar to the `useState` React hook.

### Parameters
- **graphState**: Instance of graph manager state. It`s a **graph**. You can create compositions with nested **states** which had isolate scope of graphs.
- **entity**: The key of the graph entity that we subscribe and mutate.

### Returns
`useGraph` returns an array with exactly two values:

- The current value of the graph in the state. 
- The set function that lets you update the value to a different value and trigger a re-render.
