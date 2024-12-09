import { Sheet, utils } from "xlsx";
import { useState, useEffect } from "react";

import styles from './SheetView.module.css';

type Props = {
  sheetName:string,
  sheet: Sheet,
  maxRows?:number
}

function _tableHeaderContent(row:any) {
  return <tr>{row.map((cell:any, i:number) => <th key={i}>{cell}</th>)}</tr>;
}

function _tableBodyContent(rows:any) {
  return rows.map((row:any, i:number) => <tr key={i}>{row.map((cell:any, j:number) => <td key={j}>{cell}</td>)}</tr>);
}

function SheetView({sheet, maxRows}:Props) {
  const [rows, setRows] = useState<any>(null);
  const [rowCount, setRowCount] = useState<number>(0);

  useEffect(() => {
    let nextRows = utils.sheet_to_json(sheet, {header:1}); // TODO - set the range here for efficiency.
    setRowCount(nextRows.length-1);
    if (maxRows) nextRows = nextRows.slice(0, maxRows);
    setRows(nextRows);
  }, [sheet, maxRows]);

  if (!rows) return <div>Loading...</div>;

  return (
    <div className={styles.sheetTable}>
      <h2>{rowCount} rows</h2>
      <table><thead>{_tableHeaderContent(rows[0])}</thead><tbody>{_tableBodyContent(rows.slice(1))}</tbody></table>
    </div>
  );
}

export default SheetView;