import { useState, useRef, useEffect, useMemo, RefObject, CSSProperties } from 'react';

import styles from './SheetTable.module.css';
import rowStyles from './SheetRow.module.css';
import SheetRow from "./SheetRow";
import SheetHeader from './SheetHeader';
import HoneSheet from '@/sheets/types/HoneSheet';
import SheetFooter from './SheetFooter';
import DOMTextMeasurer from './DOMTextMeasurer';
import { plural } from '@/common/englishGrammarUtil';

export enum GeneratedFooterText {
  ROW_COUNT = 0,
}

export enum HorizontalScroll {
  CLEAR = 0,
  LEFT,
  RIGHT
}

export enum VerticalScroll {
  CLEAR = 0,
  TOP,
  BOTTOM
}

type Props = {
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

type DivRef = RefObject<HTMLDivElement>;

function _measureColumnWidths(sheetTableElement:HTMLDivElement, sheet:HoneSheet):number[] {
  const measurer = new DOMTextMeasurer(sheetTableElement, rowStyles.measureCellText);
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

function _getFooterText(footerText:string|GeneratedFooterText|undefined, sheet:HoneSheet):string {
  if (footerText === undefined) return '';
  if (footerText === GeneratedFooterText.ROW_COUNT) return `${sheet.rows.length} ${plural('row', sheet.rows.length)}`;
  return footerText;
}

function _syncScrollableElements(headerInnerElement:DivRef, rowsScrollElement:DivRef) {
  if (!headerInnerElement.current || !rowsScrollElement.current) return;
  const scrollLeft = rowsScrollElement.current.scrollLeft;
  headerInnerElement.current.style.transform = `translateX(-${scrollLeft}px)`;
}

function _getRowScrollContainerStyle(displayRowCount:number|undefined, parentElement:HTMLDivElement|null):CSSProperties {
  if (!displayRowCount || !parentElement) return {};
  const measurer = new DOMTextMeasurer(parentElement, rowStyles.measureCellText);
  const lineHeight = measurer.getLineHeight();
  return {maxHeight:displayRowCount * lineHeight + 'px'};
}

function _setHorizontalScroll(rowsScrollElement:DivRef, horizontalScroll?:HorizontalScroll) {
  if (horizontalScroll === undefined || horizontalScroll === HorizontalScroll.CLEAR || rowsScrollElement.current === null) return;
  if (horizontalScroll === HorizontalScroll.LEFT) {
    rowsScrollElement.current.scrollLeft = 0;
  } else if (horizontalScroll === HorizontalScroll.RIGHT) {
    rowsScrollElement.current.scrollLeft = rowsScrollElement.current.scrollWidth;
  }
}

function _setVerticalScroll(rowsScrollElement:DivRef, verticalScroll?:VerticalScroll) {
  if (verticalScroll === undefined || verticalScroll === VerticalScroll.CLEAR || rowsScrollElement.current === null) return;
  if (verticalScroll === VerticalScroll.TOP) {
    rowsScrollElement.current.scrollTop = 0;
  } else if (verticalScroll === VerticalScroll.BOTTOM) {
    rowsScrollElement.current.scrollTop = rowsScrollElement.current.scrollHeight;
  }
}

function SheetTable({sheet, footerText, displayRowCount, selectedRowNo, onSelectCell, generatedColNo, horizontalScroll, verticalScroll}:Props) {
  const sheetTableElement = useRef<HTMLDivElement>(null);
  const headerInnerElement = useRef<HTMLDivElement>(null);
  const rowsScrollElement = useRef<HTMLDivElement>(null);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);

  useEffect(() => {
    if (!sheetTableElement.current) return;
    const nextColumnWidths:number[] = _measureColumnWidths(sheetTableElement.current, sheet);
    setColumnWidths(nextColumnWidths);
  }, [sheet, sheet.rows]);

  useEffect(() => {
    _setHorizontalScroll(rowsScrollElement, horizontalScroll);
  }, [horizontalScroll]);

  useEffect(() => {
    _setVerticalScroll(rowsScrollElement, verticalScroll);
  }, [verticalScroll]);

  const rowCount = sheet.rows.length;
  const rowsContent = columnWidths.length === 0 ? null : sheet.rows.map((row, rowI) => 
    <SheetRow key={rowI} row={row} rowNo={rowI+1} rowCount={rowCount} columnWidths={columnWidths} 
      isSelected={rowI+1===selectedRowNo} onSelectCell={onSelectCell} generatedColNo={generatedColNo}/>
  );
  
  const rowScrollContainerStyle = useMemo(() => _getRowScrollContainerStyle(displayRowCount, rowsScrollElement.current), [displayRowCount]);
  const displayFooterText = _getFooterText(footerText, sheet);
  return (
    <div className={styles.sheetTable} ref={sheetTableElement}>
      <div className={styles.headerScrollContainer}>
        <SheetHeader columns={sheet.columns} columnWidths={columnWidths} ref={headerInnerElement}/>
      </div>
      <div className={styles.rowsScrollContainer} style={rowScrollContainerStyle} ref={rowsScrollElement} onScroll={() => _syncScrollableElements(headerInnerElement, rowsScrollElement)}>
        <div className={styles.rowsInnerContainer}>
          {rowsContent}
        </div>
      </div><SheetFooter text={displayFooterText}/>
    </div>
  );
}

export default SheetTable;