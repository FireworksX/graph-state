import type { Graph, GraphState, LinkKey } from '@graph-state/core';
import { createState } from '@graph-state/core';
import { GraphValue, useGraphFields } from '@graph-state/react';
import loggerPlugin from '@graph-state/plugin-logger';
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
  //
  posts: [generatePost(), generatePost(), generatePost()],
};

interface ExtendMap {
  [graphType: string]: (cache: GraphState<any>, graphLink: LinkKey) => Graph;
}

/**
 * Сделать чтобы логер добвил метод для лога
 * getArgumentsForMutate - должен вызывать data если это функция и возвращать результат
 * @param extendsMap
 */

const extendPlugin = (extendsMap: ExtendMap) => graphState => {
  const originalMutate = graphState.mutate;
  Object.entries(extendsMap).forEach(([type, extender]) => {
    console.log(type, extender, graphState);
  });

  graphState.mutate = (...args) => {
    const { graphKey, data } = graphState.getArgumentsForMutate(...args);
    const graphType = graphState.entityOfKey(graphKey)._type;
    const extender = extendsMap?.[graphType];

    if (extender) {
      const extendData = extender(graphState, graphKey);
      console.log(extendData, args);
    }

    originalMutate(...args);
  };
};

export const graphState = createState({
  initialState: graph,
  plugins: [
    loggerPlugin(),
    extendPlugin({
      User: (cache, graphLink) => {
        console.log(cache, graphLink);
        return cache.resolve(graphLink);
      },
    }),
  ],
});

function App() {
  const posts = useGraphFields(graphState, 'Post');
  const users = useGraphFields(graphState, 'User');

  return (
    <>
      <h2>Rename authors</h2>
      {users.map(userKey => (
        <GraphValue key={userKey} graphState={graphState} field={userKey}>
          {(user, updateUser) => (
            <Author key={userKey} authorEntity={userKey}>
              <input
                type="text"
                value={user.name}
                onChange={({ target }) => updateUser({ name: target.value })}
              />
            </Author>
          )}
        </GraphValue>
      ))}

      {posts.map(post => (
        <Post key={post} postKey={post} />
      ))}
    </>
  );
}

export default App;
