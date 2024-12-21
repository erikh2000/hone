import styles from './Checkbox.module.css';

type Props = {
  label?:string,
  isChecked?:boolean,
  disabled?:boolean,
  onChange(isChecked:boolean):void
}

function Checkbox({label, isChecked, disabled, onChange}:Props) {
  return (
    <label className={styles.checkbox}>
      <input type="checkbox" checked={isChecked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export default Checkbox;