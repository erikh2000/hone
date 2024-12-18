import { findUniqueName } from "@/common/nameUtil";
import { getColumnNames } from "./sheetUtil";
import ExecutionJob from "./types/ExecutionJob";
import HoneSheet from "./types/HoneSheet";
import { getAverageCompletionTime } from "@/llm/llmStatsUtil";
import { isEmpty } from "@/common/stringUtil";
import { describeDuration } from "@/common/timeUtil";

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
  const jobRowCount = countUnprocessedRows(sheet, writeColumnName, writeStartRowNo, writeEndRowNo, onlyOverwriteBlanks)
  const timeRemainingText = describeDuration(predictExecutionSeconds(jobRowCount));
  
  return {
    sheet,
    promptTemplate,
    writeExisting:true,
    writeColumnName,
    writeStartRowNo,
    writeEndRowNo,
    onlyOverwriteBlanks,
    jobRowCount,
    processedRowCount:0,
    currentPrompt:'',
    timeRemainingText
  };
}

export function duplicateExecutionJob(from:ExecutionJob):ExecutionJob {
  return {
    sheet:from.sheet, // Note: by reference, because it's wasteful to copy the whole sheet.
    promptTemplate:from.promptTemplate,
    writeExisting:from.writeExisting,
    writeColumnName:from.writeColumnName,
    writeStartRowNo:from.writeStartRowNo,
    writeEndRowNo:from.writeEndRowNo,
    onlyOverwriteBlanks:from.onlyOverwriteBlanks,
    jobRowCount:from.jobRowCount,
    processedRowCount:from.processedRowCount,
    currentPrompt:from.currentPrompt,
    timeRemainingText:from.timeRemainingText
  };
}