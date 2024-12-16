import { useState, useEffect } from "react";

import styles from './SheetView.module.css';
import HoneSheet from "@/sheets/types/HoneSheet";
import HoneColumn from "@/sheets/types/HoneColumn";
import { getSheetRows } from "@/sheets/sheetUtil";
import GeneratedText from "@/components/generatedText/GeneratedText";

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

function _tableBodyContent(rows:any[][], generatingColumnI:number, selectedRowNo?:number, onRowSelect?:(rowNo:number)=>void) {
  return rows.map(
    (row:any, rowI:number) => {
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
  const [rows, setRows] = useState<any>(null);
  const [generatingColumnI, setGeneratingColumnI] = useState<number>(-1);

  useEffect(() => {
    let nextRows = getSheetRows(sheet, 0, maxRows, padToMax);
    setRows(nextRows);
  }, [sheet, maxRows]);

  useEffect(() => {
    if (!sheet) return;
    if (!generatingColumnName) { setGeneratingColumnI(-1); return; }
    const nextI = sheet.columns.findIndex((column) => column.name === generatingColumnName);
    setGeneratingColumnI(nextI);
  }, [sheet, generatingColumnName]);

  if (!rows) return <div>Loading...</div>;

  return (
    <div className={styles.sheetTable}>
      <table>
        <thead>{_tableHeaderContent(sheet.columns)}</thead>
        <tbody>{_tableBodyContent(rows, generatingColumnI, selectedRowNo, onRowSelect)}</tbody>
        <tfoot><tr><td colSpan={sheet.columns.length+1}><small>{sheet.rows.length} rows</small></td></tr></tfoot>
      </table>
    </div>
  );
}

export default SheetView;