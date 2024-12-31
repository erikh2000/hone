import Row from "@/sheets/types/Row"
import styles from './SheetRow.module.css';
import GeneratedText from "../generatedText/GeneratedText";
import { cellValueToText } from "./sheetTableUtil";

type Props = {
  row:Row,
  rowNo:number,
  rowCount:number,
  columnWidths:number[],
  isSelected?:boolean,
  generatedColNo?:number,
  onSelectCell?:(colNo:number, rowNo:number)=>void
}

function _classNameForCell(colNo:number, rowNo:number, colCount:number, rowCount:number, isRowSelected:boolean, isRowSelectable:boolean):string {
  let style = styles.sheetCell;
  if (rowNo % 2 === 1 && !isRowSelected) style += ` ${styles.oddRow}`;
  if (isRowSelected) style += ` ${styles.selected}`;
  if (isRowSelectable) style += ` ${styles.selectable}`;
  if (rowNo === 1) {
    if (colNo === 1) style += ` ${styles.topLeft}`;
    if (colNo === colCount) style += ` ${styles.topRight}`;
  } 
  if (rowNo === rowCount) {
    if (colNo === 1) style += ` ${styles.bottomLeft}`;
    if (colNo === colCount) style += ` ${styles.bottomRight}`;
  }
  return style;
}

function SheetRow({row, rowNo, rowCount, columnWidths, isSelected, onSelectCell, generatedColNo}:Props) {
  const colCount = row.length;

  const cells = row.map((cell, cellI) => {
    const style = columnWidths[cellI] ? {minWidth:columnWidths[cellI]} : {};
    const className = _classNameForCell(cellI+1, rowNo, colCount, rowCount, isSelected === true, onSelectCell !== undefined);
    const cellText = cellValueToText(cell);
    const cellContent = cellI+1 === generatedColNo ? <GeneratedText text={cellText} /> : cellText;
    return (
      <span key={cellI} className={className} style={style} onClick={onSelectCell ? () => onSelectCell(cellI+1, rowNo) : undefined}>
        {cellContent}
      </span>
    );
  });

  return (
    <div className={styles.sheetRow}>{cells}</div>
  );
}

export default SheetRow;