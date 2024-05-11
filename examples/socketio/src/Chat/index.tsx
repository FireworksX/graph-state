import styles from './styles.module.css';
import { Message } from '../Message';
import { useState } from 'react';
import { graphState, me, socket } from '../App.tsx';
import { useGraph } from '@graph-state/react';

export const Chat = ({ children }) => {
  const [meGraph] = useGraph(graphState, me);
  const [message, setMessage] = useState('');

  const onSubmit = e => {
    e.preventDefault();
    socket.emit('chatMessage', message);
    setMessage('');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.body}>{children}</div>
      <form action="" onSubmit={onSubmit}>
        <input
          className={styles.input}
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
      </form>
    </div>
  );
};
