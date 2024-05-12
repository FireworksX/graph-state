import styles from './styles.module.css';
import { useGraph } from '@graph-state/react';
import { currentUserID, graphState, socket } from '../App.tsx';
import { useState } from 'react';

export const Message = ({ messageKey }) => {
  const [{ content, date, user, kind, removed }] = useGraph(
    graphState,
    messageKey
  );
  const [userGraph] = useGraph(graphState, user);
  const isYou = userGraph?._id === currentUserID;
  const messageId = graphState.entityOfKey(messageKey)?._id;
  const [updateText, setUpdateText] = useState(undefined);

  const updateMessage = () => {
    socket.emit('updateMessage', messageId, updateText);
    setUpdateText(undefined);
  };

  return (
    <div className={styles.message}>
      {kind === 'login' && (
        <div className={styles.text}>Log in {userGraph?.name}</div>
      )}
      {kind === 'logout' && (
        <div className={styles.text}>Logout user {userGraph?.name}</div>
      )}
      {kind === 'message' && (
        <>
          <img
            className={styles.avatar}
            src="https://cdn-icons-png.flaticon.com/512/4253/4253081.png"
          />
          <div className={styles.meta}>
            <div className={styles.name}>
              {userGraph?.name}
              {isYou && ' (you)'}
              <div className={styles.date}>{date}</div>
            </div>
            <div className={styles.text}>
              {typeof updateText === 'string' ? (
                <>
                  <input
                    type="text"
                    value={updateText}
                    onChange={e => setUpdateText(e.target.value)}
                  />
                  <button className={styles.update} onClick={updateMessage}>
                    Submit
                  </button>
                </>
              ) : removed ? (
                'Removed message'
              ) : (
                content
              )}
            </div>
          </div>
          {!removed && isYou && (
            <>
              <button
                className={styles.update}
                onClick={() => setUpdateText('')}
              >
                Update
              </button>
              <button
                className={styles.remove}
                onClick={() => socket.emit('safeRemoveMessage', messageId)}
              >
                Safe Remove
              </button>
              <button
                className={styles.remove}
                onClick={() => socket.emit('removeMessage', messageId)}
              >
                Remove
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};
