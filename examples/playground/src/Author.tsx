import { useGraph } from '@graph-state/react';
import { extendUser, graphState } from './App.tsx';
import type { FC, PropsWithChildren } from 'react';

interface AuthorProps extends PropsWithChildren {
  authorEntity: string;
}

export const Author: FC<AuthorProps> = ({ authorEntity, children }) => {
  const [author] = useGraph(graphState, authorEntity);

  return (
    <div style={{ background: '#ffdddd' }}>
      <h3>{author?.name}</h3>
      <pre>{author?.age}</pre>
      <button onClick={() => graphState.extendGraph(author, extendUser)}>
        Extend
      </button>
      {children}
    </div>
  );
};
