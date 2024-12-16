import styles from "./DialogLabeledText.module.css";

interface IProps {
  labelText:string,
  value:string
}

function DialogLabeledText(props:IProps) {
  const {labelText, value} = props;

  return (<div className={styles.container}>
    <label className={styles.label} htmlFor={labelText}>{labelText}</label>
    <span className={styles.value}>{value}</span>
  </div>);
}

export default DialogLabeledText;