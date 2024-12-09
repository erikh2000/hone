import styles from './ModalDialog.module.css';
import {PropsWithChildren} from "react";

interface IProps {
  isOpen:boolean,
  onCancel?:() => void,
  title:string
}

function _doNothing(event:any) { event.stopPropagation(); }

// Make sure any changes handle this edge case: 1. click within the dialog, 2. drag outside of the dialog (overlay area),
// 3. release mouse. It should not call onCancel() in this case.

function ModalDialog(props:PropsWithChildren<IProps>) {
  if (!props.isOpen) return null;
  const {children, onCancel, title} = props;
  const fullscreenOverlayStyle = `${styles.fullscreenOverlay} ${onCancel ? styles.clickable : ''}`;
  return (
    <div className={fullscreenOverlayStyle} onMouseDown={onCancel}>
      <div className={styles.dialog} onClick={_doNothing} onMouseDown={_doNothing}>
        <h1>{title}</h1>
        {children}
      </div>
    </div>
  );
}

export default ModalDialog;