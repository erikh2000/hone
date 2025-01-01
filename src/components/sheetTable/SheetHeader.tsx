import { forwardRef } from 'react';

import styles from './SheetHeader.module.css';

type Props = {
  columnNames:string[],
  columnWidths:number[]
}

function SheetHeader(props:Props, ref:React.Ref<HTMLDivElement>) {
  const {columnNames, columnWidths} = props;
  const cells = columnNames.map((columnName, columnI) => {
    const style = columnWidths[columnI] ? {minWidth:columnWidths[columnI]} : {};
    return (
      <span key={columnI} style={style}>
        {columnName}
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