import type { AnyObject } from '@graph-state/core';
import { createState } from '@graph-state/core';
import {
  GraphValue,
  useGraph,
  useGraphFields,
  useGraphStack,
} from '@graph-state/react';
import loggerPlugin from '@graph-state/plugin-logger';
import profilerPlugin from '@graph-state/plugin-profiler';
import { animated } from '@react-spring/web';

export const generateId = () => Math.random().toString(16).slice(2);

const layer = {
  _id: '8cb2e27f5a5c9',
  _type: 'Frame',
  interactions: [],
  opacity: 1,
  goal: {
    id: 4,
    value: 'click-header',
  },
};

const graphState = createState({
  type: 'State',
  initialState: {
    layer,
  },
  resolvers: {
    Frame: {
      opacity: (parent, state, info) => {
        return 1;
      },
    },
  },
  plugins: [loggerPlugin()],
});

// Object.values(fragmentData).forEach(node => {
//   graphState.mutate(node);
// });

window.graphState = graphState;

function omit<T extends AnyObject, P extends string[]>(
  obj: T,
  ...props: P
): Omit<T, P[number]> {
  const result = { ...obj };
  props.forEach(prop => {
    delete result[prop];
  });
  return result;
}

// console.log(graphState.resolve(graphState));

function App() {
  // const posts = useGraphFields(graphState, 'Post');
  const [{ interactions }, setInteractions] = useGraph(
    graphState,
    'Frame:8cb2e27f5a5c9',
    {
      selector: graph => ({ interactions: graph.interactions }),
    }
  );

  return (
    <>
      <h1>Hello world</h1>

      <button
        onClick={() =>
          setInteractions({
            interactions: [
              { on: interactions.length % 2 ? 'click' : 'mouseover' },
            ],
          })
        }
      >
        Mutate interactions
      </button>
      {/*<GraphValue*/}
      {/*  graphState={graphState}*/}
      {/*  field={undefined}*/}
      {/*  options={{ safe: false }}*/}
      {/*>*/}
      {/*  {value => {*/}
      {/*    return <>{console.log(value)}</>;*/}
      {/*  }}*/}
      {/*</GraphValue>*/}
      <ul>
        {interactions.map(el => (
          <li key={el._id}>
            <pre>{JSON.stringify(el)}</pre>
            <button onClick={() => graphState.invalidate(el)}>remove</button>
          </li>
        ))}
      </ul>
      {/*<button onClick={() => setKey('User:2')}>Change key</button>*/}
      <button
        onClick={() => {
          graphState.mutate(
            'User:0',
            prev => ({
              ...prev,
              skills: ['Skill:js', 'Skill:ts'],
            }),
            { replace: true }
          );
        }}
      >
        Remove skill
      </button>
      <button
        onClick={() => {
          graphState.mutate('User:0', {
            test: ['$$File:100'],
            field: '$$File:200',
          });
        }}
      >
        Change order
      </button>

      {/*<ul>*/}
      {/*  {allSkills?.map(skill => (*/}
      {/*    <li key={skill?._id}>{skill?._id ?? 'null'}</li>*/}
      {/*  ))}*/}
      {/*</ul>*/}

      <animated.div
        style={{
          width: 100,
          height: 100,
          background: 'red',
        }}
      />
      <button
        onClick={() => {
          const l = graphState.mutate(graphState.key, {
            rotate: Math.random() * 300,
          });

          console.log(l);
        }}
      >
        Rotate
      </button>
      {/*<br />*/}
      {/*<h2>Rename authors</h2>*/}
      {/*{users.map(userKey => (*/}
      {/*  <GraphValue key={userKey} graphState={graphState} field={userKey}>*/}
      {/*    {(user, updateUser) => (*/}
      {/*      <Author key={userKey} authorEntity={userKey}>*/}
      {/*        <input*/}
      {/*          type="text"*/}
      {/*          value={user.name}*/}
      {/*          onChange={({ target }) => updateUser({ name: target.value })}*/}
      {/*        />*/}
      {/*        <label htmlFor="">*/}
      {/*          Age*/}
      {/*          <input*/}
      {/*            type="text"*/}
      {/*            value={user.age}*/}
      {/*            onChange={({ target }) => updateUser({ age: target.value })}*/}
      {/*          />*/}
      {/*        </label>*/}
      {/*      </Author>*/}
      {/*    )}*/}
      {/*  </GraphValue>*/}
      {/*))}*/}

      {/*{posts.map(post => (*/}
      {/*  <Post key={post} postKey={post} />*/}
      {/*))}*/}
    </>
  );
}

export default App;
