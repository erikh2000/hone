import styles from './WaitingEllipsis.module.css';

function WaitingEllipsis() {
  return (
    <span className={styles.ellipsis}>
      <span key="0">.</span>
      <span key="1">.</span>
      <span key="2">.</span>
    </span>
  );
}

export default WaitingEllipsis;