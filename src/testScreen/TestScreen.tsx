import LivingSvg from '@/components/livingSvg/LivingSvg';
import styles from './TestScreen.module.css';
import testSvg from './test.svg';

function TestScreen() {
  return (
    <div className={styles.container}>
      <LivingSvg url={testSvg} framesPerSecond={15} shimmerAmount={.05} />
    </div>
  );
}

export default TestScreen;