import { createState } from '@graph-state/core';
import {
  GraphValue,
  useGraph,
  useGraphFields,
  useGraphStack,
} from '@graph-state/react';
import loggerPlugin from '@graph-state/plugin-logger';
import { SpringValue, animated } from '@react-spring/web';
import fragmentData from './fragment.json';

export const generateId = () => Math.random().toString(16).slice(2);

const graphState = createState({
  type: 'State',
  initialState: {
    skills: [
      {
        _type: 'Skill',
        _id: 123,
        name: 'Typescript',
      },
      {
        _type: 'Skill',
        _id: 3432,
        name: 'JS',
      },
      {
        _type: 'Skill',
        _id: 432423,
        name: 'PHP',
      },
    ],
  },
  plugins: [
    loggerPlugin(),
    state => {
      state.remove = index => {
        state.mutate(
          state.key,
          p => {
            return {
              skills: p.skills.toSpliced(index, 1),
            };
          },
          { replace: true }
        );
      };
    },
  ],
});

// Object.values(fragmentData).forEach(node => {
//   graphState.mutate(node);
// });

window.graphState = graphState;

// console.log(graphState.resolve(graphState));

function App() {
  // const posts = useGraphFields(graphState, 'Post');
  const [type] = useGraph(graphState, 'User:0', { deep: true });
  const [state] = useGraph(graphState, graphState.key);
  const allSkills = useGraphStack(graphState, state.skills);

  // console.log(rotate);
  // console.log(value);
  return (
    <>
      <h1>Hello world</h1>
      <GraphValue
        graphState={graphState}
        field={undefined}
        options={{ safe: false }}
      >
        {value => {
          return <>{console.log(value)}</>;
        }}
      </GraphValue>
      <pre>{JSON.stringify(type)}</pre>
      <button
        onClick={() => {
          graphState.mutate({
            _type: 'User',
            _id: '0',
            age: { _type: 'Age', _id: 10, value: 22 },
          });
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
        {allSkills?.map((skill, i) => (
          <li key={skill?._id}>
            {skill?.name ?? 'null'}{' '}
            <button onClick={() => graphState.remove(i)}>remove</button>
          </li>
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
