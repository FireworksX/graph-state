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

const state = {
  _type: 'Document',
  _id: 'gdfhfdghsf',
  children: [
    {
      _type: 'Breakpoint',
      _id: 'mobile',
      isPrimary: true,
      width: 320,
      children: [
        {
          _type: 'Frame',
          _id: '1',
          parentKey: {
            _type: '$Breakpoint',
            _id: 'mobile',
          },
          children: [
            {
              _type: 'Text',
              _id: '64bc371fa3b4c',
              x: 0,
              y: 0,
              width: 100,
              height: 100,
              layoutSizingHorizontal: 'Fill',
              layoutSizingVertical: 'Hug',
              rotation: 0,
              opacity: 1,
              visible: true,
              parentKey: {
                _type: '$Frame',
                _id: '1',
              },
              content:
                '<p><span style="white-space: pre-wrap;">Смотри рейтинг букмекеров в Россииdas</span></p>',
              overrides: [
                {
                  _type: '$Text',
                  _id: '5cd1afa3fc027',
                },
              ],
            },
          ],
          name: 'Content',
          overrides: [
            {
              _type: '$Frame',
              _id: 'd2d0cc5be2c8c',
            },
          ],
        },
      ],
      parentKey: {
        _type: '$Document',
        _id: 'gdfhfdghsf',
      },
      overrides: [
        {
          _type: '$Breakpoint',
          _id: 'tbalee',
        },
      ],
    },
  ],
};

interface UserGraph {
  _type: 'User';
  age: number;
}

interface PostGraph {
  _type: 'Post';
  value: string;
}

interface StateGraph {
  _type: 'State';
  version: string;
}

const graphState = createState<UserGraph | PostGraph | StateGraph>({
  type: 'State',
  initialState: {
    value: 'hello',
    rotate: 0,
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

window.graphState = graphState;

// console.log(graphState.resolve(graphState));

function App() {
  // const posts = useGraphFields(graphState, 'Post');
  const [{ rotate }] = useGraph(graphState);

  console.log(rotate);

  // console.log(rotate);
  // console.log(value);
  return (
    <>
      <h1>Hello world</h1>

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
