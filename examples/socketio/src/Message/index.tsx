import styles from './styles.module.css';
import { useGraph } from '@graph-state/react';
import { graphState } from '../App.tsx';

export const Message = ({ messageKey }) => {
  const [{ content, date, user }] = useGraph(graphState, messageKey);
  const [userGraph] = useGraph(graphState, user);

  return (
    <div className={styles.message}>
      <img
        className={styles.avatar}
        src="https://cdn-icons-png.flaticon.com/512/4253/4253081.png"
      />
      <div className={styles.meta}>
        <div className={styles.name}>
          {userGraph?.firstName} {userGraph?.lastName}
          <div className={styles.date}>{date}</div>
        </div>
        <div className={styles.text}>{content}</div>
      </div>
    </div>
  );
};
