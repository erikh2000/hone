import ContentButton from "@/components/contentButton/ContentButton"
import styles from './FieldInsertionList.module.css';

type Props = {
  columnNames:string[]
  onInsert:(columnName:string)=>void
  disabled?:boolean
}

function FieldInsertionList({columnNames, onInsert, disabled}:Props) {
  return (
    <div className={styles.container}>
        <span className={styles.label}>Insert field:</span>
        {columnNames.map((name, i) => <ContentButton key={i} text={name} onClick={() => onInsert(name)} disabled={disabled}/>)}
    </div>
  );
}

export default FieldInsertionList;