import styles from './TestScreen.module.css';

function TestScreen() {
  return (
    <div className={styles.outer}>
      <div className={styles.inner} />
    </div>
  );
}

export default TestScreen;