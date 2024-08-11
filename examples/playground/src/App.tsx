import type { Entity, Graph, GraphState, LinkKey } from '@graph-state/core';
import { createState } from '@graph-state/core';
import { GraphValue, useGraph, useGraphFields } from '@graph-state/react';
import loggerPlugin from '@graph-state/plugin-logger';
import type { Extender } from '@graph-state/plugin-extend';
import extendPlugin from '@graph-state/plugin-extend';
import { Post } from './Post.tsx';
import { Author } from './Author.tsx';
import { expect } from 'vitest';
import { useGraphStack } from '@graph-state/react';
import { SpringValue, animated } from '@react-spring/web';

export const generateId = () => Math.random().toString(16).slice(2);

const random = (min: number, max: number) =>
  Math.floor(min + Math.random() * (max + 1 - min));

const authorOne = {
  _type: 'User',
  _id: 'one',
  name: 'John Doe',
  key: '100',
};

const authorTwo = {
  _type: 'User',
  _id: 'two',
  name: 'Sam Smith',
  key: '200',
};

const generatePost = () => ({
  _type: 'Post',
  _id: generateId(),
  review: {
    name: 'ReviewName',
    reviewAdmin: {
      user: 'admin',
    },
  },
  title: `Post title ${generateId()}`,
  description:
    'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
  author: authorOne,
  authors: [authorOne, authorTwo, { test: 1 }],
});

const vv = new SpringValue(0);

const reactSpringPlugin = state => {};

const graphState = createState({
  initialState: {
    rotate: new SpringValue(0),
    sections: {
      _type: 'Section',
      _id: '1',
      nested: { _type: 'Nested', _id: '2' },
    },
  },
  skip: [v => v instanceof SpringValue],
});

window.graphState = graphState;

console.log(graphState.resolve(graphState));

function App() {
  // const posts = useGraphFields(graphState, 'Post');
  const [{ rotate }] = useGraph(graphState);
  // console.log(rotate);
  // console.log(value);
  return (
    <>
      <h1>Hello world</h1>
      <button
        onClick={() => {
          graphState.invalidate('Nested:2');
          console.log(graphState.resolve(graphState));
        }}
      >
        Invalidate
      </button>
      <animated.div
        style={{
          width: 100,
          height: 100,
          background: 'red',
          rotate: rotate,
        }}
      />
      <button onClick={() => rotate.start(Math.random() * 300)}>Rotate</button>
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
