import styles from "./DialogTextInput.module.css";

interface IProps {
  labelText:string,
  value:string,
  isSecret?:boolean,
  onChangeText:(text:string) => void
}

function DialogTextInput(props:IProps) {
  const {labelText, value, onChangeText} = props;

  const inputType = props.isSecret ? 'password' : 'text';
  return (<div className={styles.textInputLine}>
    <label className={styles.textInputLineLabel} htmlFor={labelText}>{labelText}</label>
    <input name={labelText} className={styles.textInputLineValue} type={inputType} value={value} onChange={event => onChangeText(event.target.value) } />
  </div>);
}

export default DialogTextInput;