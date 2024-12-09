import styles from './PaneHeaderButton.module.css';

interface IProps {
  text:string,
  onClick:any
  disabled?:boolean
}

function PaneHeaderButton(props:IProps) {
  const { text, onClick, disabled } = props;
  const buttonClass = disabled ? styles.contentPaneButtonDisabled : styles.contentPaneButton;
  const textClass = disabled ? styles.contentPaneButtonTextDisabled : styles.contentPaneButtonText;
  return (
    <button className={buttonClass} onClick={onClick} disabled={disabled}>
      <span className={textClass}>{text}</span>
    </button>
  );
}

export default PaneHeaderButton;