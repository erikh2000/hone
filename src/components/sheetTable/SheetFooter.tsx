import styles from './SheetFooter.module.css';

type Props = {
  text:string
}

function SheetFooter({text}:Props) {
  return (<div className={styles.footer}>{text}</div>);
}

export default SheetFooter;