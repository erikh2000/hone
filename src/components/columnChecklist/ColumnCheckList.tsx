import { useMemo } from "react";
import HoneSheet from "@/sheets/types/HoneSheet"
import { getColumnNames } from "@/sheets/sheetUtil";
import Checklist from "../checklist/Checklist";


type Props = {
  sheet:HoneSheet,
  selectedColumnNos:number[],
  onChange(selectedColumnNos:number[]):void
  disabled?:boolean
}

function ColumnChecklist({sheet, selectedColumnNos, onChange, disabled}:Props) {
  const columnNames:string[] = useMemo(() => getColumnNames(sheet), [sheet]);
  
  return Checklist({ 
    label:'Columns',
    includeSelectAll:true,
    options:columnNames, 
    selectedOptionNos:selectedColumnNos, 
    onChange, 
    disabled 
  });
}

export default ColumnChecklist;