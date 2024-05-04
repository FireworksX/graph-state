import { createState } from '@graph-state/core';
import { useGraphFields } from '@graph-state/react';
import { Post } from './Post.tsx';
import { Author } from './Author.tsx';

export const generateId = () => Math.random().toString(16).slice(2);

const random = (min: number, max: number) =>
  Math.floor(min + Math.random() * (max + 1 - min));

const authorOne = {
  _type: 'User',
  _id: generateId(),
  name: 'John Doe',
  key: '100',
};

const authorTwo = {
  _type: 'User',
  _id: generateId(),
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
  child: {
    _type: 'Layer',
    _id: 'fff',
    recursive: 'Root:rootId',
  },
  name: 'rootname',
  skills: [
    { _type: 'Skill', _id: 'skillId', name: 'js', webLink: 'Https' },
    'php',
  ],

  posts: [generatePost(), generatePost(), generatePost()],
};

export const graphState = createState({
  keys: {
    User: user => `${user.key}`,
  },
  initialState: graph,
});


function App() {
  const posts = useGraphFields(graphState, 'Post');
  const users = useGraphFields(graphState, 'User');

  const renameAuthor = (userKey: string, nextName: string) =>
    graphState.mutate(userKey, {
      name: nextName
    });



  return (
    <>
      <h2>Rename authors</h2>
      {posts.map((link) => (
        <>
          <pre>{JSON.stringify(graphState.resolve(link), null, 2)}</pre>
          <hr/>
        </>
      ))}
      {users.map((user) => (
        <Author key={user} authorEntity={user}>
          <input
            type="text"
            value={(graphState.resolve(user) as any).name}
            onChange={({ target }) => renameAuthor(user, target.value)}
          />
        </Author>
      ))}

      {posts.map((post) => (
        <Post key={post} postKey={post} />
      ))}
    </>
  );
}

export default App;
