import { findUniqueName } from "@/common/nameUtil";
import { getColumnNames } from "./sheetUtil";
import ExecutionJob from "./types/ExecutionJob";
import HoneSheet from "./types/HoneSheet";
import { getAverageCompletionTime } from "@/llm/llmStatsUtil";
import { isEmpty } from "@/common/stringUtil";

const DEFAULT_PROMPT_AVERAGE_MSECS = 5000;

export function predictExecutionSeconds(rowCount:number):number {
  const averageSecsPerRow = (getAverageCompletionTime() || DEFAULT_PROMPT_AVERAGE_MSECS) / 1000;
  return rowCount * averageSecsPerRow;
}

export function countUnprocessedRows(sheet:HoneSheet, writeColumnName:string, writeStartRowNo:number, writeEndRowNo:number, onlyOverwriteBlanks:boolean):number {
  const writeColumnI = sheet.columns.findIndex((column) => column.name === writeColumnName);
  if (writeColumnI === -1 || !onlyOverwriteBlanks) return writeEndRowNo - writeStartRowNo + 1;
  
  let unprocessedRowCount = 0;
  for (let i = writeStartRowNo; i < writeEndRowNo; i++) {
    const row:any[] = sheet.rows[i-1];
    const cellValue:any = row[writeColumnI];
    if (isEmpty(cellValue)) unprocessedRowCount++;
  }
  return unprocessedRowCount;
}

export function createExecutionJob(sheet:HoneSheet, promptTemplate:string):ExecutionJob {
  const writeColumnName = findUniqueName('Result', getColumnNames(sheet));
  const writeStartRowNo = 1;
  const writeEndRowNo = sheet.rows.length;
  const onlyOverwriteBlanks = true;
  const unprocessedRowCount = countUnprocessedRows(sheet, writeColumnName, writeStartRowNo, writeEndRowNo, onlyOverwriteBlanks)
  const predictedExecutionSeconds = predictExecutionSeconds(unprocessedRowCount);
  
  return {
    sheet,
    writeExisting:true,
    predictedExecutionSeconds,
    promptTemplate,
    writeColumnName,
    writeStartRowNo,
    writeEndRowNo,
    onlyOverwriteBlanks,
    unprocessedRowCount
  };
}

export function copyExecutionJob(from:ExecutionJob):ExecutionJob {
  return {
    sheet:from.sheet, // Note: by reference, because it's wasteful to copy the whole sheet.
    writeExisting:from.writeExisting,
    predictedExecutionSeconds:from.predictedExecutionSeconds,
    promptTemplate:from.promptTemplate,
    writeColumnName:from.writeColumnName,
    writeStartRowNo:from.writeStartRowNo,
    writeEndRowNo:from.writeEndRowNo,
    onlyOverwriteBlanks:from.onlyOverwriteBlanks,
    unprocessedRowCount:from.unprocessedRowCount
  };
}