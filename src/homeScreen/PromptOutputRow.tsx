import { useEffect, useState } from "react";

import HoneColumn from "@/sheets/types/HoneColumn";
import HoneSheet from "@/sheets/types/HoneSheet";
import styles from './PromptOutputRow.module.css';
import GeneratedText from "@/components/generatedText/GeneratedText";

type Props = {
  sheet:HoneSheet;
  rowNo:number;
  outputValue:string|null;
}

function _tableHeaderContent(columns:HoneColumn[]) {
  return <tr><th key={-1}>#</th>{columns.map((column, i) => <th key={i}>{column.name}</th>)}</tr>;
}

function _tableBodyContent(row:any[], rowNo:number) {
  const cells = row.map((cell:any, columnI:number) => {
    const cellValue = (columnI === row.length - 1) ? <GeneratedText text={'' + cell}/> : '' + cell;
    return (<td key={columnI}>{cellValue}</td>);
  });
  return <tr><td key={-1}>{rowNo}</td>{cells}</tr>
}

function PromptOutputRow({sheet, rowNo, outputValue}: Props) {
  const [columns, setColumns] = useState<HoneColumn[]>([]);
  const [row, setRow] = useState<any[]>([]);

  useEffect(() => {
    if (!sheet) { setColumns([]); setRow([]); return; }
    setColumns(sheet.columns.concat({name:"Test Output", isWritable:true}));
    const nextRow = [...sheet.rows[rowNo-1]];
    nextRow[sheet.columns.length] = '';
    setRow(nextRow);
  }, [sheet, rowNo]);

  useEffect(() => {
    if (row.length === 0) return;
    const nextRow = [...row];
    nextRow[sheet.columns.length] = outputValue;
    setRow(nextRow);
  }, [outputValue]);

  return (
    <div className={styles.promptOutputRow}>
      <table>
        <thead>{_tableHeaderContent(columns)}</thead>
        <tbody>{_tableBodyContent(row, rowNo)}</tbody>
        <tfoot><tr><td colSpan={columns.length+2}><small>test preview</small></td></tr></tfoot>
      </table>
    </div>
  );
}

export default PromptOutputRow;