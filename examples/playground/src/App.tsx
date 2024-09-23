import { createState } from '@graph-state/core';
import { GraphValue, useGraph, useGraphFields } from '@graph-state/react';
import loggerPlugin from '@graph-state/plugin-logger';
import { SpringValue, animated } from '@react-spring/web';

export const generateId = () => Math.random().toString(16).slice(2);

const graphState = createState({
  type: 'State',
  initialState: {
    author: {
      _type: 'User',
      _id: 0,
      age: { _type: 'Age', _id: 0, value: 27 },
      skills: ['js', 'ts', { _type: 'Skill', _id: 'Python' }],
    },
  },
  plugins: [
    (state, { overrideMutate }) => {
      overrideMutate((next, ...args) => {
        next(...args);
      });
    },
    // (state, { overrideMutate }) => {
    //   overrideMutate((next, ...args) => {
    //     return 'two';
    //   });
    // },
  ],
});

graphState.onRemoveLink(l => {
  console.log(l);
});

graphState.mutate({
  _type: 'Age',
  _id: '0',
  name: {
    _type: 'Name',
    _id: 'nameNested',
  },
});

window.graphState = graphState;

// console.log(graphState.resolve(graphState));

function App() {
  // const posts = useGraphFields(graphState, 'Post');
  const [{ rotate, value }] = useGraph(graphState);
  const [type] = useGraph(graphState, 'User:0');

  // console.log(rotate);
  // console.log(value);
  return (
    <>
      <h1>Hello world</h1>
      <pre>{JSON.stringify(type)}</pre>
      <pre>{JSON.stringify(value)}</pre>
      <button
        onClick={() => {
          graphState.mutate(
            {
              _type: 'User',
              _id: '0',
              name: 'John',
              skills: ['go'],
            },
            { replace: true }
          );

          console.log(graphState.resolve('Age:0'));
        }}
      >
        Remove nested items
      </button>
      <animated.div
        style={{
          width: 100,
          height: 100,
          background: 'red',
          rotate,
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
