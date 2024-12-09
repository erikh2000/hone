import styles from './DialogButton.module.css';

interface IProps {
  text:string,
  onClick:any,
  disabled?:boolean,
  isPrimary?:boolean
}

function DialogButton(props:IProps) {
  const { text, onClick, disabled, isPrimary } = props;
  const buttonClass = disabled 
    ? styles.dialogButtonDisabled 
    : isPrimary 
      ? styles.dialogButtonPrimary
      : styles.dialogButton;
  const textClass = disabled ? styles.dialogButtonTextDisabled : styles.dialogButtonText;
  return (
    <button className={buttonClass} onClick={onClick} disabled={disabled}>
      <span className={textClass}>{text}</span>
    </button>
  );
}

export default DialogButton;