import { useGraph } from '@graph-state/react';
import { graphState } from './App.tsx';
import type { FC, PropsWithChildren } from 'react';

interface AuthorProps extends PropsWithChildren {
  authorEntity: string;
}

export const Author: FC<AuthorProps> = ({ authorEntity, children }) => {
  const author = useGraph(graphState, authorEntity);

  return (
    <div style={{ background: '#ffdddd' }}>
      <h3>{author?.name}</h3>
      {children}
    </div>
  );
};
