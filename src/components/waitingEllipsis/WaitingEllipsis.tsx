import styles from './WaitingEllipsis.module.css';

type Props = {
  trailing?: boolean;
}

function WaitingEllipsis(props:Props) {
  const className = props.trailing ? `${styles.ellipsis} ${styles.trailing}` : styles.ellipsis;
  return (
    <span className={className}>
      <span key="0">.</span>
      <span key="1">.</span>
      <span key="2">.</span>
    </span>
  );
}

export default WaitingEllipsis;