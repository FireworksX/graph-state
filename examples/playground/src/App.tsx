import { createState } from '@graph-state/core';
import {
  GraphValue,
  useGraph,
  useGraphFields,
  useGraphStack,
} from '@graph-state/react';
import loggerPlugin from '@graph-state/plugin-logger';
import { SpringValue, animated } from '@react-spring/web';
import fragment from './fragment';

export const generateId = () => Math.random().toString(16).slice(2);

const graphState = createState({
  type: 'State',
  initialState: {
    authors: [
      {
        _type: 'User',
        _id: 0,
        currentSkill: 'Skill:js',
        skills: [{ _type: 'Skill', _id: 'js' }],
      },
    ],
    fragment,
  },
  skip: [
    input => {
      console.log(input);
      return input?.startsWith?.('$$');
    },
  ],
});

window.graphState = graphState;

// console.log(graphState.resolve(graphState));

function App() {
  // const posts = useGraphFields(graphState, 'Post');
  const [type] = useGraph(graphState, 'User:0');
  const allSkillsLinks = useGraphFields(graphState, 'Skill');
  const allSkills = useGraphStack(graphState, allSkillsLinks);
  console.log(allSkills);

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
          graphState.mutate('User:0', {
            skills: [{ _type: 'Skill', _id: 'python' }],
          });
        }}
      >
        Append skill
      </button>
      <button
        onClick={() => {
          graphState.mutate('User:0', {
            currentSkill: 'Skill:python',
          });
        }}
      >
        Change current skill
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
