import { createState } from '@graph-state/core';
import {
  GraphValue,
  useGraph,
  useGraphFields,
  useGraphStack,
  useGraphEffect,
} from '@graph-state/react';
import loggerPlugin from '@graph-state/plugin-logger';
import { SpringValue, animated } from '@react-spring/web';
import { useState } from 'react';

export const generateId = () => Math.random().toString(16).slice(2);

const graphState = createState({
  type: 'State',
  initialState: {
    user: {
      _type: 'User',
      _id: '1',
      profile: {
        _type: 'Profile',
        _id: 10,
        circular: 'User:1',
      },
      skills: [
        {
          _type: 'Skill',
          _id: 'js',
          user: 'User:1',
        },
        'User:1',
      ],
    },
    head: {
      _type: 'Layer',
      _id: 'header',
      user: 'Layer:header',
    },
  },
});

// Object.values(fragmentData).forEach(node => {
//   graphState.mutate(node);
// });

window.graphState = graphState;

// console.log(graphState.resolve(graphState));

function App() {
  // const posts = useGraphFields(graphState, 'Post');
  const [type] = useGraph(graphState, 'User:1', { deep: true });
  const [key, setKey] = useState('User:1');
  const allSkills = useGraphStack(graphState, ['Skill:js']);
  useGraphEffect(graphState, key, (prevValue, nextValue) => {
    console.log(prevValue, nextValue);
    // if (nextValue) {
    //   graphState.mutate({
    //     _type: 'Layer',
    //     _id: 'header',
    //     user: 'Layer:header',
    //     field: '123',
    //   });
    // }
  });

  return (
    <>
      <h1>Hello world</h1>
      {/*<GraphValue*/}
      {/*  graphState={graphState}*/}
      {/*  field={undefined}*/}
      {/*  options={{ safe: false }}*/}
      {/*>*/}
      {/*  {value => {*/}
      {/*    return <>{console.log(value)}</>;*/}
      {/*  }}*/}
      {/*</GraphValue>*/}
      <pre>{JSON.stringify(type)}</pre>
      <button onClick={() => setKey('User:2')}>Change key</button>
      <button
        onClick={() => {
          graphState.mutate(key, { age: Math.random() * 100 });
        }}
      >
        Set age
      </button>
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

      <ul>
        {allSkills?.map(skill => (
          <li key={skill?._id}>{skill?._id ?? 'null'}</li>
        ))}
      </ul>

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
