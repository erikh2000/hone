import Selector from "@/components/selector/Selector";

type Props = {
  sheetNames:string[],
  disabled?:boolean,
  selectedSheetName:string,
  onChange(sheetName:string):void
}

function SheetSelector({sheetNames, selectedSheetName, onChange, disabled}:Props) {
  const selectedOptionNo = sheetNames.indexOf(selectedSheetName);
  return (
    <Selector 
      label="Sheets" 
      optionNames={sheetNames} 
      selectedOptionNo={selectedOptionNo} 
      onChange={(optionNo) => onChange(sheetNames[optionNo])} disabled={disabled} 
    />
  );
}

export default SheetSelector;