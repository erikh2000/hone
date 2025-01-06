import LivingSvg from '@/components/livingSvg/LivingSvg';
import styles from './TestScreen.module.css';
import testSvg2 from './deskGuy.svg';
import { SquiggleType } from '@/components/squiggleFilter/SquiggleFilter';

function TestScreen() {
  const textReplacements = {declaration:'I am smart.'};
  return (
    <div className={styles.container}>
      <LivingSvg url={testSvg2} squiggleType={SquiggleType.SUBTLE} className={styles.svgBox} textReplacements={textReplacements}/>
    </div>
  );
}

export default TestScreen;