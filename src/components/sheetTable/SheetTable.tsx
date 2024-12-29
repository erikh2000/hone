import { useState, useRef, useEffect } from 'react';

import styles from './SheetTable.module.css';
import rowStyles from './SheetRow.module.css';
import SheetRow from "./SheetRow";
import SheetHeader from './SheetHeader';
import HoneSheet from '@/sheets/types/HoneSheet';
import SheetFooter from './SheetFooter';
import DOMTextMeasurer from './DOMTextMeasurer';

type Props = {
  sheet:HoneSheet,
  footerText?:string
}

function _measureColumnWidths(sheetTableElement:HTMLDivElement, sheet:HoneSheet):number[] {
  const measurer = new DOMTextMeasurer(sheetTableElement, rowStyles.sheetRowCell);
  const widths = sheet.columns.map(column => measurer.measureTextWidth(column.name));
  for(let rowI = 0; rowI < sheet.rows.length; rowI++) {
    const row = sheet.rows[rowI];
    for(let cellI = 0; cellI < row.length; cellI++) {
      const cell = '' + row[cellI];
      widths[cellI] = Math.max(widths[cellI], measurer.measureTextWidth(cell));
    }
  }
  return widths;
}

function SheetTable({sheet, footerText}:Props) {
  const sheetTableElement = useRef<HTMLDivElement>(null);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);

  useEffect(() => {
    if (!sheetTableElement.current) return;
    const nextColumnWidths:number[] = _measureColumnWidths(sheetTableElement.current, sheet);
    setColumnWidths(nextColumnWidths);
  }, [sheet, sheet.rows]);

  const rowsContent = columnWidths.length === 0 ? null : sheet.rows.map((row, rowI) => 
    <SheetRow key={rowI} row={row} rowNo={rowI+1} columnWidths={columnWidths} />
  );
  
  return (
    <div className={styles.scrollContainer}>
      <div className={styles.sheetTable} ref={sheetTableElement}>
        <SheetHeader columns={sheet.columns} columnWidths={columnWidths} />
        {rowsContent}
        <SheetFooter text={footerText ?? ''}/>
      </div>
    </div>
  );
}

export default SheetTable;