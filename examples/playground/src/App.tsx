import type { AnyObject } from '@graph-state/core';
import { createState } from '@graph-state/core';
import {
  GraphValue,
  useGraph,
  useGraphFields,
  useGraphStack,
  useGraphEffect,
  useGraphReferences,
} from '@graph-state/react';
import loggerPlugin from '@graph-state/plugin-logger';
import profilerPlugin from '@graph-state/plugin-profiler';
import historyPlugin from '@graph-state/plugin-history';
import { animated } from '@react-spring/web';
import { useState } from 'react';

export const generateId = () => Math.random().toString(16).slice(2);

const layer = {
  _id: '8cb2e27f5a5c9',
  _type: 'Frame',
  interactions: [],
  opacity: 1,
  goal: {
    _type: 'Goal',
    _id: 10,
    value: 33,
    varsValue: 'Variables:adf13',
    nextLayer: {
      _id: 12,
      _type: 'Frame',
      varsValue: 'Variables:adf13',
    },
  },
  varsValue: 'Variables:adf13',
};

const variable = {
  _id: 'adf13',
  _type: 'Variables',
  value: 10,
};

const graphState = createState({
  type: 'State',
  initialState: {
    layer,
    variable,
  },
  plugins: [loggerPlugin(), historyPlugin()],
});

// Object.values(fragmentData).forEach(node => {
//   graphState.mutate(node);
// });

window.graphState = graphState;

// console.log(graphState.resolve(graphState));

function App() {
  const [pause, setPause] = useState();
  // const posts = useGraphFields(graphState, 'Post');
  const [frame, setFrame] = useGraph(graphState, 'Frame:8cb2e27f5a5c9', {
    pause,
  });

  useGraphEffect(
    graphState,
    'Frame:8cb2e27f5a5c9',
    () => {
      console.log('update dd');
    },
    { pause }
  );

  return (
    <>
      <h1>Frame value: {frame?.opacity}</h1>

      <hr />
      <button onClick={() => setFrame({ opacity: Math.random() })}>
        Random
      </button>
      <button onClick={() => setPause(p => !p)}>Toggle pause</button>
    </>
  );
}

export default App;
