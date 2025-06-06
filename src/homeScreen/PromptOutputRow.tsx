import { useMemo, useState, useEffect } from "react";

import HoneSheet from "@/sheets/types/HoneSheet";
import styles from './PromptOutputRow.module.css';
import SheetTable from "@/components/sheetTable/SheetTable";
import HorizontalScroll from "@/components/sheetTable/types/HorizontalScroll";

type Props = {
  sheet:HoneSheet;
  rowNo:number;
  outputValue:string|null;
}

function PromptOutputRow({sheet, rowNo, outputValue}: Props) {
  const [horizontalScroll, setHorizontalScroll] = useState(HorizontalScroll.RIGHT);

  const previewSheet = useMemo(() => {
    if (!sheet) return null;
    const columns = [...sheet.columns, {name:'Output', isWritable:true}];
    const nextRow = [...sheet.rows[rowNo-1]];
    nextRow[sheet.columns.length] = outputValue;
    return {name:'Preview', columns, rows:[nextRow]};
  }, [sheet, rowNo, outputValue]);

  useEffect(() => {
    setHorizontalScroll(HorizontalScroll.RIGHT); // I don't want user to miss the output in the rightmost column.
  }, [outputValue]);

  useEffect(() => {
    if (horizontalScroll !== HorizontalScroll.CLEAR) setHorizontalScroll(HorizontalScroll.CLEAR); // Clear the scroll so it can be set again.
  }, [horizontalScroll]);

  if (!previewSheet) return null;

  const columnNames = previewSheet.columns.map(column => column.name);
  return (
    <div className={styles.promptOutputRow}>
      <SheetTable columnNames={columnNames} rows={previewSheet.rows} footerText="Test Preview" 
        generatedColNo={previewSheet.columns.length} horizontalScroll={horizontalScroll} 
      />
    </div>
  );
}

export default PromptOutputRow;