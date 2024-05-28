import type { Entity, Graph, GraphState, LinkKey } from '@graph-state/core';
import { createState } from '@graph-state/core';
import { GraphValue, useGraphFields } from '@graph-state/react';
import loggerPlugin from '@graph-state/plugin-logger';
import type { Extender } from '@graph-state/plugin-extend';
import extendPlugin from '@graph-state/plugin-extend';
import { Post } from './Post.tsx';
import { Author } from './Author.tsx';

export const generateId = () => Math.random().toString(16).slice(2);

const random = (min: number, max: number) =>
  Math.floor(min + Math.random() * (max + 1 - min));

const authorOne = {
  _type: 'User',
  _id: 'one',
  name: 'John Doe',
  key: '100',
  characteristics: {
    gender: 'male',
    age: 20,
    traits: {
      openness: true,
      extroversion: true,
      humility: false,
    },
  },
};

const authorTwo = {
  _type: 'User',
  _id: 'two',
  name: 'Sam Smith',
  key: '200',
  age: 44,
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
  author: random(0, 1) ? authorOne : authorTwo,
});

const graph = {
  _type: 'Root',
  _id: 'rootId',
  authorOne,
  child: {
    _type: 'Layer',
    _id: 'fff',
    authorOne,
    recursive: 'Root:rootId',
  },
  // name: 'rootname',
  // skills: [
  //   { _type: 'Skill', _id: 'skillId', name: 'js', webLink: 'Https' },
  //   'php',
  // ],

  posts: [generatePost(), generatePost(), generatePost()],
};

/**
 * Сделать чтобы логер добавил метод для лога
 * getArgumentsForMutate - должен вызывать data если это функция и возвращать результат
 * @param extendsMap
 */

export const extendUser: Extender = (cache, user) => {
  console.log(cache);
  return {
    ...user,
    age: user.age ?? random(18, 40),
  };
};

const momUser = { _type: 'User', _id: 'mom', name: 'Mom' };
const user = { _type: 'User', _id: 'userId', name: 'John Doe', mom: momUser };

export const graphState = createState({
  initialState: graph,
  plugins: [
    loggerPlugin(),
    // extendPlugin({
    //   Post: (graph, cache) => {
    //     return {
    //       ...graph,
    //       isOldAuthor: () => cache.resolve(graph.author)?.age > 24,
    //     };
    //   },
    // }),
  ],
});

function App() {
  // const posts = useGraphFields(graphState, 'Post');
  const users = useGraphFields(graphState, 'User');

  return (
    <>
      <h2>Rename authors</h2>
      <button
        // onClick={() => graphState.mutate('User:userId', { name: 'John Doe' })}
        onClick={() =>
          graphState.mutate('User:one', prev => ({
            ...prev,
            characteristics: {
              ...prev.characteristics,
              traits: {
                openness: false,
                extroversion: false,
                humility: true,
                awareness: true,
              },
            },
          }))
        }
      >
        Update Author One
      </button>
      {users.map(userKey => (
        <GraphValue key={userKey} graphState={graphState} field={userKey}>
          {(user, updateUser) => (
            <Author key={userKey} authorEntity={userKey}>
              <input
                type="text"
                value={user.name}
                onChange={({ target }) => updateUser({ name: target.value })}
              />
              <label htmlFor="">
                Age
                <input
                  type="text"
                  value={user.age}
                  onChange={({ target }) => updateUser({ age: target.value })}
                />
              </label>
            </Author>
          )}
        </GraphValue>
      ))}

      {/*{posts.map(post => (*/}
      {/*  <Post key={post} postKey={post} />*/}
      {/*))}*/}
    </>
  );
}

export default App;
