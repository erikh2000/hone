import styles from './Selector.module.css';

interface IProps {
  disabled?:boolean,
  label?:string,
  selectedOptionNo:number,
  optionNames:string[],
  onChange?:(optionNo:number) => void,
  onClick?:(optionNo:number) => void
}

function Selector(props:IProps) {
  const { disabled, label, optionNames, onClick, onChange, selectedOptionNo } = props;

  function _onOptionClick(optionNo:number) {
    if (disabled) return;
    if (onClick) onClick(optionNo);
    if (optionNo === selectedOptionNo) return;
    if (onChange) onChange(optionNo);
  }

  const options = optionNames.map((optionName, optionNo) => {
    const reclickableSelection = onClick !== undefined;
    const selectorButtonSelected = reclickableSelection ? styles.selectorButtonSelectedReclickable : styles.selectorButtonSelected;
    const selected = optionNo === selectedOptionNo;
    let buttonClass = disabled
      ? styles.selectorButtonDisabled
      : selected ? selectorButtonSelected : styles.selectorButton;
    const textClass = disabled
      ? styles.selectorButtonTextDisabled
      : selected ? styles.selectorButtonTextSelected : styles.selectorButtonText;
    if (optionNo === 0) buttonClass = `${buttonClass} ${styles.firstSelectorButton}`;
    if (optionNo === optionNames.length-1) buttonClass = `${buttonClass} ${styles.lastSelectorButton}`;
    return (
      <button key={optionName} className={buttonClass} onClick={() => _onOptionClick(optionNo)} >
    <span className={textClass}>{optionName}</span>
      </button>)
  });

  const labelElement = label ? <span className={styles.label}>{label}:</span> : null;

  return (
    <div className={styles.bar}>
      {labelElement}
  {options}
  </div>  
);
}

export default Selector;