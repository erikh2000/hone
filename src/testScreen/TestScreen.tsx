import LivingSvg from '@/components/livingSvg/LivingSvg';
import styles from './TestScreen.module.css';
import testSvg from './test5.svg';
import { SquiggleType } from '@/components/squiggleFilter/SquiggleFilter';

function TestScreen() {
  const textReplacements = {declaration:'I am smart.'};
  return (
    <div className={styles.container}>
      <LivingSvg url={testSvg} squiggleType={SquiggleType.NONE} className={styles.svgBox} textReplacements={textReplacements}/>
      <LivingSvg url={testSvg} squiggleType={SquiggleType.SUBTLE} className={styles.svgBox} textReplacements={textReplacements}/>
      <LivingSvg url={testSvg} squiggleType={SquiggleType.SWIMMING_POOL} className={styles.svgBox} textReplacements={textReplacements}/>
      <LivingSvg url={testSvg} squiggleType={SquiggleType.BOILING} className={styles.svgBox} textReplacements={textReplacements}/>
      <LivingSvg url={testSvg} squiggleType={SquiggleType.GASEOUS} className={styles.svgBox} textReplacements={textReplacements}/>
      <LivingSvg url={testSvg} squiggleType={SquiggleType.DISINTEGRATING} className={styles.svgBox} textReplacements={textReplacements}/>
      <LivingSvg url={testSvg} squiggleType={SquiggleType.STATIC} className={styles.svgBox} textReplacements={textReplacements}/>
      <LivingSvg url={testSvg} squiggleType={SquiggleType.JANK_TV} className={styles.svgBox} textReplacements={textReplacements}/>
      <LivingSvg url={testSvg} squiggleType={SquiggleType.PLYMPTON} className={styles.svgBox} textReplacements={textReplacements}/>
    </div>
  );
}

export default TestScreen;