import { useMemo } from "react";

import styles from './SheetView.module.css';
import HoneSheet from "@/sheets/types/HoneSheet";
import HoneColumn from "@/sheets/types/HoneColumn";
import { getSheetRows, HTML_NBSP } from "@/sheets/sheetUtil";
import GeneratedText from "@/components/generatedText/GeneratedText";
import Rowset from "@/sheets/types/Rowset";
import { plural } from "@/common/englishGrammarUtil";

type Props = {
  sheet: HoneSheet,
  maxRows?:number,
  padToMax?:boolean,
  generatingColumnName?:string,
  selectedRowNo?:number
  onRowSelect?:(rowNo:number)=>void
}

function _tableHeaderContent(columns:HoneColumn[]) {
  return <tr><th key={-1}>#</th>{columns.map((column, i) => <th key={i}>{column.name}</th>)}</tr>;
}

function _paddedRowContent(rowI:number, columnCount:number) {
  const cells = Array(columnCount).fill(null).map((_, i) => <td key={i}></td>);
  return (<tr key={rowI}><td key={-1}>{HTML_NBSP}</td>{cells}</tr>);
}

function _tableBodyContent(rows:Rowset, sheetRowCount:number, generatingColumnI:number, selectedRowNo?:number, onRowSelect?:(rowNo:number)=>void) {
  return rows.map(
    (row:any, rowI:number) => {
      if (rowI >= sheetRowCount) return _paddedRowContent(rowI, row.length);

      const isSelected = (selectedRowNo === rowI+1);
      const rowStyle = isSelected ? styles.selectedRow : '';
      const cells = row.map((cell:any, columnI:number) => {
        const cellValue = (columnI === generatingColumnI) ? <GeneratedText text={'' + cell}/> : '' + cell;
        return (<td key={columnI}>{cellValue}</td>);
      });
      return (
        <tr className={rowStyle} key={rowI} onClick={() => { if (onRowSelect) onRowSelect(rowI+1)} } >
          <td key={-1}>{rowI+1}</td>{cells}
        </tr>
      );
  });
}

function SheetView({sheet, maxRows, padToMax, generatingColumnName, selectedRowNo, onRowSelect}:Props) {
  const rows = useMemo(() => getSheetRows(sheet, 0, maxRows, padToMax), [sheet, maxRows, padToMax]);
  const generatingColumnI = useMemo(() => { 
    if (!generatingColumnName) return -1;
    return sheet.columns.findIndex((column) => column.name === generatingColumnName); 
  }, [sheet, generatingColumnName]);

  if (!rows) return <div>Loading...</div>;
  const sheetRowCount = sheet.rows.length;

  return (
    <div className={styles.sheetTable}>
      <table>
        <thead>{_tableHeaderContent(sheet.columns)}</thead>
        <tbody>{_tableBodyContent(rows, sheetRowCount, generatingColumnI, selectedRowNo, onRowSelect)}</tbody>
        <tfoot><tr><td colSpan={sheet.columns.length+1}><small>{sheetRowCount} {plural('row', sheetRowCount)}</small></td></tr></tfoot>
      </table>
    </div>
  );
}

export default SheetView;