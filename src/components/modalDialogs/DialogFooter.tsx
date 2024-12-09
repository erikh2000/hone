import styles from './DialogFooter.module.css';
import {PropsWithChildren} from "react";

interface IProps {}

function DialogFooter(props:PropsWithChildren<IProps>) {
  const {children} = props;
  return (
    <div className={styles.container}>
      {children}
    </div>
  );
}

export default DialogFooter;