import { useGraph } from '@graph-state/react';
import { graphState } from './App.tsx';
import { Author } from './Author.tsx';
import type { FC } from 'react';

interface PostProps {
  postKey: string;
}

export const Post: FC<PostProps> = ({ postKey }) => {
  const [post] = useGraph(graphState, postKey);

  return (
    <div style={{ width: 300, background: '#eee' }}>
      <h1>
        {post.title}{' '}
        <button onClick={() => graphState.invalidate(postKey)}>Remove</button>
      </h1>
      <p>{post.description}</p>
      <pre>Author status: {post.isOldAuthor?.() ? 'OLD' : 'YONG'}</pre>
      <Author authorEntity={post.author} />
    </div>
  );
};
