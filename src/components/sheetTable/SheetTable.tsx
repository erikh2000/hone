import { useState, useRef, useEffect } from 'react';

import styles from './SheetTable.module.css';
import SheetRow from "./SheetRow";
import SheetHeader from './SheetHeader';
import HoneSheet from '@/sheets/types/HoneSheet';
import SheetFooter from './SheetFooter';
import HorizontalScroll from './types/HorizontalScroll';
import VerticalScroll from './types/VerticalScroll';
import { GeneratedFooterText } from './types/GeneratedFooterText';
import { getFooterText, getRowScrollContainerStyle, measureColumnWidths, setHorizontalScroll, setVerticalScroll, syncScrollableElements } from './interactions/table';

type Props = {
  columnNames:string[],
  sheet:HoneSheet,
  displayRowCount?:number,
  selectedColNo?:number,
  selectedRowNo?:number,
  horizontalScroll?:HorizontalScroll,
  verticalScroll?:VerticalScroll,
  onSelectCell?:(colNo:number, rowNo:number)=>void,
  generatedColNo?:number,
  footerText?:string|GeneratedFooterText
}

function SheetTable({sheet, footerText, displayRowCount, selectedRowNo, onSelectCell, generatedColNo, horizontalScroll, verticalScroll}:Props) {
  const sheetTableElement = useRef<HTMLDivElement>(null);
  const headerInnerElement = useRef<HTMLDivElement>(null);
  const rowsScrollElement = useRef<HTMLDivElement>(null);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);

  useEffect(() => {
    if (!sheetTableElement.current) return;
    const nextColumnWidths:number[] = measureColumnWidths(sheetTableElement.current, sheet);
    setColumnWidths(nextColumnWidths);
  }, [sheet, sheet.rows]);

  useEffect(() => {
    setHorizontalScroll(rowsScrollElement, horizontalScroll);
  }, [horizontalScroll]);

  useEffect(() => {
    setVerticalScroll(rowsScrollElement, verticalScroll);
  }, [verticalScroll]);

  const rowCount = sheet.rows.length;
  const rowsContent = columnWidths.length === 0 ? null : sheet.rows.map((row, rowI) => 
    <SheetRow key={rowI} row={row} rowNo={rowI+1} rowCount={rowCount} columnWidths={columnWidths} 
      isSelected={rowI+1===selectedRowNo} onSelectCell={onSelectCell} generatedColNo={generatedColNo}/>
  );
  
  const rowScrollContainerStyle = getRowScrollContainerStyle(displayRowCount, rowsScrollElement.current);
  const displayFooterText = getFooterText(footerText, sheet);
  return (
    <div className={styles.sheetTable} ref={sheetTableElement}>
      <div className={styles.headerScrollContainer}>
        <SheetHeader columns={sheet.columns} columnWidths={columnWidths} ref={headerInnerElement}/>
      </div>
      <div className={styles.rowsScrollContainer} style={rowScrollContainerStyle} ref={rowsScrollElement} 
          onScroll={() => syncScrollableElements(headerInnerElement, rowsScrollElement)}>
        <div className={styles.rowsInnerContainer}>
          {rowsContent}
        </div>
      </div><SheetFooter text={displayFooterText}/>
    </div>
  );
}

export default SheetTable;