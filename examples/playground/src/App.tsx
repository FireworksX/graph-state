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

const graph = {
  _type: 'Root',
  _id: 'rootId',
  authors: [authorOne, authorOne, authorOne, authorOne],
  posts: {
    deepPosts: [generatePost(), generatePost(), generatePost()],
  },
};

/**
 * Сделать чтобы логер добавил метод для лога
 * getArgumentsForMutate - должен вызывать data если это функция и возвращать результат
 * @param extendsMap
 */

// const initial = {
//   _type: 'Root',
//   _id: 'id',
//   fieldOld: { value: 1 },
//   fieldNew: { value: 2 },
// };
//
// export const graphState = createState({
//   initialState: initial,
//   // initialState: graph,
//   plugins: [loggerPlugin()],
// });

const initial = {
  _type: 'Root',
  _id: 'id',
  nested: [{ value: 1 }, { value: 2 }],
};

const graphState = createState({
  initialState: initial,
});

window.graphState = graphState;

function App() {
  // const posts = useGraphFields(graphState, 'Post');
  const [value] = useGraph(graphState, { _type: 'Root', _id: 'id' });
  console.log(value);
  return (
    <>
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
