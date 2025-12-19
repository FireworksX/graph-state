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

export const generateId = () => Math.random().toString(16).slice(2);

export const avatarLayer = { _type: 'Layer', _id: 'avatar' };
export const rootLayer = { _type: 'Layer', _id: 'root' };

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
    _type: 'Layer',
    _id: 1,
    children: [
      {
        _type: 'Layer',
        _id: 2,
        opacity: 1,
      },
    ],
  },
  plugins: [loggerPlugin(), historyPlugin()],
});

// Object.values(fragmentData).forEach(node => {
//   graphState.mutate(node);
// });

window.graphState = graphState;

// console.log(graphState.resolve(graphState));

function App() {
  // const posts = useGraphFields(graphState, 'Post');
  const [root] = useGraph(graphState, 'Layer:1');
  const [frame, setFrame] = useGraph(graphState, 'Layer:2');

  // const [goal, setGoal] = useGraph(graphState, 'Goal:10');
  // const references = useGraphReferences(graphState, 'Variables:adf13', {
  //   withPartialKeys: false,
  // });

  return (
    <>
      <ul>
        {root.children?.map(child => (
          <li>{child}</li>
        ))}
      </ul>
      {/*<h1>Goal value: {goal?.value}</h1>*/}
      <h1>Frame value: {frame?.opacity}</h1>

      <button onClick={() => setFrame({ opacity: Math.random() })}>
        Update
      </button>

      <button
        onClick={() => {
          graphState.invalidate('Layer:2');
        }}
      >
        Remove
      </button>
    </>
  );
}

export default App;
