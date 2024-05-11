import styles from './styles.module.css';
import { Message } from '../Message';
import { useEffect, useState } from 'react';
import { currentUserID, graphState, socket } from '../App.tsx';
import { useGraph } from '@graph-state/react';

export const Chat = ({ children }) => {
  const [currentUser, setCurrentUser] = useGraph(
    graphState,
    `User:${currentUserID}`
  );
  const [message, setMessage] = useState('');
  const [login, setLogin] = useState('');

  const onSubmit = e => {
    e.preventDefault();
    socket.emit('chatMessage', message);
    setMessage('');
  };

  const onLogin = e => {
    setCurrentUser({ name: login });
    e.preventDefault();
    setLogin('');
    setCurrentUser((actualUser: any) => {
      socket.emit('login', actualUser);
    });
  };

  return (
    <div className={styles.wrapper}>
      {currentUser ? (
        <>
          <div className={styles.body}>{children}</div>
          <form action="" onSubmit={onSubmit}>
            <input
              className={styles.input}
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </form>
        </>
      ) : (
        <form className={styles.loginBody} onSubmit={onLogin}>
          <div>Enter your login</div>
          <input
            className={styles.loginInput}
            type="text"
            value={login}
            onChange={e => setLogin(e.target.value)}
          />
        </form>
      )}
    </div>
  );
};
