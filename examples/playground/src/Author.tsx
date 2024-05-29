import { useGraph } from '@graph-state/react';
import { graphState } from './App.tsx';
import type { FC, PropsWithChildren } from 'react';

interface AuthorProps extends PropsWithChildren {
  authorEntity: string;
}

export const Author: FC<AuthorProps> = ({ authorEntity, children }) => {
  const [author, setAuthor] = useGraph(graphState, authorEntity);

  return (
    <>
      <button onClick={() => setAuthor({ name: 'Hello kitty' })}>
        Update author
      </button>

      <div style={{ background: '#ffdddd' }}>
        <h3>{author?.name}</h3>
        <pre>{author?.age}</pre>
        <pre>{JSON.stringify(author, null, 2)}</pre>
        <button onClick={() => graphState.invalidate(authorEntity)}>
          Invalidate Author
        </button>
        {children}
      </div>
    </>
  );
};
