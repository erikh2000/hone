import styles from './ProgressBar.module.css';
import StripedProgressImage from './images/stripedProgress.png';

function _percent(value:number) {
  return `${value}%`;
}

type Props = {
  percentComplete: number
}

function ProgressBar(props:Props) {
  const {percentComplete} = props;
  
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="<http://www.w3.org/2000/svg>" className={styles.container}>
      <defs>
        <pattern id="imgpattern" x="0%" y="0" width="1" height="1" viewBox="0 0 256 256" preserveAspectRatio="none">
          <image width="256" height="256" href={StripedProgressImage}/>
          <animate attributeName="x" values="0%;100%" dur="2s" repeatCount="indefinite" />
        </pattern>
      </defs>
      <rect
        x='0'
        y='0'
        width='100%'
        height = '100%'
        fill='#222'
      />
      <rect
        x='0'
        y='0'
        width={_percent(percentComplete * 100)}
        height = '100%'
        fill='url(#imgpattern)'
        stroke='#000000'
        strokeWidth={.1}
      />
    </svg>);
}

export default ProgressBar;