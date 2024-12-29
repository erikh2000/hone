import HoneColumn from '@/sheets/types/HoneColumn';
import styles from './SheetHeader.module.css';

type Props = {
  columns:HoneColumn[],
  columnWidths:number[],
}

function SheetHeader({columns, columnWidths}:Props) {
  const cells = columns.map((column, columnI) => {
    const style = columnWidths[columnI] ? {width:columnWidths[columnI]} : {};
    return (
      <span key={columnI} style={style}>
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