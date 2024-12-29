import HoneColumn from '@/sheets/types/HoneColumn';
import styles from './SheetHeader.module.css';
import { useRef, useEffect } from "react";

type Props = {
  columns:HoneColumn[],
  columnWidths:number[],
  onMeasureColumns:(columnWidths:number[])=>void
}

function SheetHeader({columns, columnWidths, onMeasureColumns}:Props) {
  const spansRef = useRef<(HTMLSpanElement|null)[]>([]);

  useEffect(() => {
    if (columnWidths.length === columns.length) return; // No new columns to measure.
    const measuredWidths = spansRef.current.map(span => span ? span.offsetWidth : 0);
    onMeasureColumns(measuredWidths);
  }, [columns, columnWidths, onMeasureColumns]);

  const cells = columns.map((column, columnI) => {
    const style = columnWidths[columnI] ? {width:columnWidths[columnI]} : {};
    return (
      <span key={columnI} ref={el => spansRef.current[columnI] = el} style={style}>
        {column.name}
      </span>
    );
  });

  const className = styles.sheetHeader;
  return (
    <div className={className}>
      {cells}
    </div>
  );
}

export default SheetHeader;