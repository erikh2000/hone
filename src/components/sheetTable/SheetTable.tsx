import { useState, useRef, useEffect, MutableRefObject, useLayoutEffect } from 'react';

import styles from './SheetTable.module.css';
import SheetRow from "./SheetRow";
import SheetHeader from './SheetHeader';
import HoneSheet from '@/sheets/types/HoneSheet';
import SheetFooter from './SheetFooter';

type Props = {
  sheet:HoneSheet,
  footerText?:string
}

type MeasurementState = {
  isMeasuring:boolean,
  widths:number[],
  totalMeasureCount:number,
  measuredRowNos:Set<number>
}

function _duplicateMeasurementState(from:MeasurementState):MeasurementState {
  return {
    isMeasuring:from.isMeasuring,
    widths:[...from.widths],
    totalMeasureCount:from.totalMeasureCount,
    measuredRowNos:new Set(from.measuredRowNos)
  };
}

function _updateColumnWidths(rowNo:number, widths:number[], measurementStateRef:MutableRefObject<MeasurementState>, setColumnWidths:Function) {
  if (measurementStateRef.current.measuredRowNos.has(rowNo) || !measurementStateRef.current.isMeasuring) return;
  const nextState = _duplicateMeasurementState(measurementStateRef.current);
  nextState.measuredRowNos.add(rowNo);
  for(let i=0; i<widths.length; i++) {
    if (nextState.widths[i] === undefined || nextState.widths[i] < widths[i]) {
      nextState.widths[i] = widths[i];
    }
  }
  if (nextState.totalMeasureCount - nextState.measuredRowNos.size === 0) {
    console.log('Finished measuring columns. Widths=', nextState.widths);
    nextState.isMeasuring = false;
    setColumnWidths(nextState.widths);
  }
  measurementStateRef.current = nextState;
}

function _createEmptyMeasurementState(rowCount:number):MeasurementState {
  return {
    isMeasuring:true,
    widths:[],
    totalMeasureCount:rowCount+1, //+1 for header.
    measuredRowNos:new Set()
  };
}

function SheetTable({sheet, footerText}:Props) {
  const measurementStateRef = useRef<MeasurementState>(_createEmptyMeasurementState(sheet.rows.length));
  const [columnWidths, setColumnWidths] = useState<number[]>([]);

  useEffect(() => {
    if (measurementStateRef.current.isMeasuring) return;
    console.log('Measuring columns...');
    measurementStateRef.current = _createEmptyMeasurementState(sheet.rows.length);
    setColumnWidths([]);
  }, [sheet, sheet.rows]);

  console.log('SheetTable rendering with columnWidths=', columnWidths);
  const rowsContent = sheet.rows.map((row, rowI) => 
    <SheetRow key={rowI} row={row} rowNo={rowI+1} columnWidths={columnWidths} 
      onMeasureColumns={measuredWidths => _updateColumnWidths(rowI+1, measuredWidths, measurementStateRef, setColumnWidths)}/>
  );
  
  return (
    <div className={styles.scrollContainer}>
      <div className={styles.sheetTable}>
        <SheetHeader columns={sheet.columns} columnWidths={columnWidths} 
          onMeasureColumns={measuredWidths => _updateColumnWidths(0, measuredWidths, measurementStateRef, setColumnWidths)}/>
        {rowsContent}
        <SheetFooter text={footerText ?? ''}/>
      </div>
    </div>
  );
}

export default SheetTable;