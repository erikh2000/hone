import Row from "@/sheets/types/Row"
import styles from './SheetRow.module.css';

type Props = {
  row:Row,
  rowNo:number,
  rowCount:number,
  columnWidths:number[]
}

function _classNameForCell(colNo:number, rowNo:number, colCount:number, rowCount:number):string {
  const colorStyle = (rowNo % 2 === 0) ? '' : ` ${styles.oddRow}`;
  if (rowNo === 1) {
    if (colNo === 1) return `${styles.sheetCellTopLeft}${colorStyle}`;
    if (colNo === colCount) return `${styles.sheetCellTopRight}${colorStyle}`;
  } else if (rowNo === rowCount) {
    if (colNo === 1) return `${styles.sheetCellBottomLeft}${colorStyle}`;
    if (colNo === colCount) return `${styles.sheetCellBottomRight}${colorStyle}`;
  }
  return `${styles.sheetCell}${colorStyle}`;
}

function SheetRow({row, rowNo, rowCount, columnWidths}:Props) {
  const colCount = row.length;
  const cells = row.map((cell, cellI) => {
    const style = columnWidths[cellI] ? {minWidth:columnWidths[cellI]} : {};
    const className = _classNameForCell(cellI+1, rowNo, colCount, rowCount);
    return (
      <span key={cellI} className={className} style={style}>
        {cell}
      </span>
    );
  });

  return (
    <div className={styles.sheetRow}>{cells}</div>
  );
}

export default SheetRow;