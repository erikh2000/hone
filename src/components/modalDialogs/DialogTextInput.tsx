import styles from "./DialogTextInput.module.css";

interface IProps {
  labelText:string,
  value:string,
  onChangeText:(text:string) => void
}

function DialogTextInput(props:IProps) {
  const {labelText, value, onChangeText} = props;

  return (<div className={styles.textInputLine}>
    <label className={styles.textInputLineLabel} htmlFor={labelText}>{labelText}</label>
    <input name={labelText} className={styles.textInputLineValue} type='text' value={value} onChange={event => onChangeText(event.target.value) } />
  </div>);
}

export default DialogTextInput;