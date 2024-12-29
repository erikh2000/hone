import Row from "@/sheets/types/Row"
import styles from './SheetRow.module.css';

type Props = {
  row:Row,
  rowNo:number,
  columnWidths:number[]
}

function SheetRow({row, rowNo, columnWidths}:Props) {
  const cells = row.map((cell, cellI) => {
    const style = columnWidths[cellI] ? {width:columnWidths[cellI]} : {};
    return (
      <span key={cellI} style={style}>
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