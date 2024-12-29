import Row from "@/sheets/types/Row"
import styles from './SheetRow.module.css';

type Props = {
  row:Row,
  rowNo:number,
  rowCount:number,
  columnWidths:number[],
  isSelected?:boolean,
  onSelectCell?:(colNo:number, rowNo:number)=>void
}

function _classNameForCell(colNo:number, rowNo:number, colCount:number, rowCount:number, isRowSelected:boolean, isRowSelectable:boolean):string {
  let appendStyle = (rowNo % 2 === 1 && !isRowSelected) ? ` ${styles.oddRow}` : '';
  if (isRowSelected) appendStyle += ` ${styles.selected}`;
  if (isRowSelectable) appendStyle += ` ${styles.selectable}`;
  if (rowNo === 1) {
    if (colNo === 1) return `${styles.sheetCellTopLeft}${appendStyle}`;
    if (colNo === colCount) return `${styles.sheetCellTopRight}${appendStyle}`;
  } else if (rowNo === rowCount) {
    if (colNo === 1) return `${styles.sheetCellBottomLeft}${appendStyle}`;
    if (colNo === colCount) return `${styles.sheetCellBottomRight}${appendStyle}`;
  }
  return `${styles.sheetCell}${appendStyle}`;
}

function SheetRow({row, rowNo, rowCount, columnWidths, isSelected, onSelectCell}:Props) {
  const colCount = row.length;

  const cells = row.map((cell, cellI) => {
    const style = columnWidths[cellI] ? {minWidth:columnWidths[cellI]} : {};
    const className = _classNameForCell(cellI+1, rowNo, colCount, rowCount, isSelected === true, onSelectCell !== undefined);
    return (
      <span key={cellI} className={className} style={style} onClick={onSelectCell ? () => onSelectCell(cellI+1, rowNo) : undefined}>
        {cell}
      </span>
    );
  });

  return (
    <div className={styles.sheetRow}>{cells}</div>
  );
}

export default SheetRow;