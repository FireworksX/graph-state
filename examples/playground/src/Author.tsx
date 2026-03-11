import { useGraph } from '@graph-state/react';
import { graphState } from './App.tsx';
import type { FC, PropsWithChildren } from 'react';

// Искусственно тяжёлая функция для имитации дорогого рендера
function heavyComputation() {
  let result = 0;
  for (let i = 0; i < 50_000_000; i++) {
    result += Math.sqrt(Math.sin(i) * Math.cos(i) * Math.tan(i % 1000));
    result += Math.log(Math.abs(result) + 1);
    result = Math.atan2(result, i + 1);
  }
  return result;
}

interface AuthorProps extends PropsWithChildren {
  authorEntity: string;
}

export const Author: FC<AuthorProps> = ({ authorEntity, children }) => {
  const [author, setAuthor] = useGraph(graphState, authorEntity);

  // Блокирующее вычисление при каждом рендере
  const _heavy = heavyComputation();

  console.log('[Author] render', authorEntity, _heavy);

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
