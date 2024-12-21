import styles from './Checklist.module.css';
import Checkbox from "@/components/checkbox/Checkbox";

type Props = {
  options:string[],
  label?:string,
  selectedOptionNos:number[],
  onChange(selectedOptionNos:number[]):void,
  includeSelectAll?:boolean,
  disabled?:boolean
}

function _getAllOptionNos(options:string[]) { return options.map((_, i) => i); }

function _addToSelectedOptions(selectedOptionNos:number[], optionNo:number):number[] {
  return selectedOptionNos.includes(optionNo) ? selectedOptionNos : [...selectedOptionNos, optionNo];
}

function _removeFromSelectedOptions(selectedOptionNos:number[], optionNo:number):number[] {
  return selectedOptionNos.filter((no) => no !== optionNo);
}

function Checklist({options, selectedOptionNos, onChange, includeSelectAll, disabled, label}:Props) {

  function _handleSelectAll(isChecked:boolean) {
    const nextSelectedOptions = isChecked ? _getAllOptionNos(options) : [];
    onChange(nextSelectedOptions);
  }

  function _handleOptionChange(optionNo:number, isChecked:boolean) {
    const nextSelectedOptions = isChecked 
      ? _addToSelectedOptions(selectedOptionNos, optionNo) 
      : _removeFromSelectedOptions(selectedOptionNos, optionNo);
    onChange(nextSelectedOptions);
  }

  const useLabel = `${label}:` || '';
  return (
    <label className={styles.checklist}>
      {useLabel}
      {includeSelectAll && (
        <Checkbox
          label="Select All"
          isChecked={selectedOptionNos.length === options.length}
          disabled={disabled}
          onChange={_handleSelectAll}
        />
      )}
      {options.map((option, i) => (
        <Checkbox
          key={i}
          label={option}
          isChecked={selectedOptionNos.includes(i)}
          disabled={disabled}
          onChange={(isChecked) => _handleOptionChange(i, isChecked)}
        />
      ))}
    </label>
  );
}

export default Checklist;