import { forwardRef } from 'react';

import HoneColumn from '@/sheets/types/HoneColumn';
import styles from './SheetHeader.module.css';

type Props = {
  columns:HoneColumn[],
  columnWidths:number[]
}

function SheetHeader(props:Props, ref:React.Ref<HTMLDivElement>) {
  const {columns, columnWidths} = props;
  const cells = columns.map((column, columnI) => {
    const style = columnWidths[columnI] ? {minWidth:columnWidths[columnI]} : {};
    return (
      <span key={columnI} style={style}>
        {column.name}
      </span>
    );
  });

  const className = styles.sheetHeader;
  return (
    <div className={className} ref={ref}>
      {cells}
    </div>
  );
}

export default forwardRef(SheetHeader);