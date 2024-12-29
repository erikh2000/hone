import Row from "@/sheets/types/Row"
import styles from './SheetRow.module.css';
import { useRef, useEffect } from "react";

type Props = {
  row:Row,
  rowNo:number,
  columnWidths:number[],
  onMeasureColumns:(columnWidths:number[])=>void
}

function SheetRow({row, rowNo, columnWidths, onMeasureColumns}:Props) {
  const spansRef = useRef<(HTMLSpanElement|null)[]>([]);

  useEffect(() => {
    if (columnWidths.length === row.length) return; // No new columns to measure.
    console.log('Measuring columns...');
    const measuredWidths = spansRef.current.map(span => span ? span.offsetWidth : 0);
    onMeasureColumns(measuredWidths);
  }, [row, columnWidths, onMeasureColumns]);

  const cells = row.map((cell, cellI) => {
    const style = columnWidths[cellI] ? {width:columnWidths[cellI]} : {};
    return (
      <span key={cellI} ref={el => spansRef.current[cellI] = el} style={style}>
        {cell}
      </span>
    );
  });

  const isEven = rowNo % 2 === 0;
  const className = isEven ? styles.sheetRowEven : styles.sheetRowOdd;
  return (
    <div className={className}>
      {cells}
    </div>
  );
}

export default SheetRow;