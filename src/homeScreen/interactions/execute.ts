import ExecutionJob from "@/sheets/types/ExecutionJob";
import ExecuteSetupDialog from "../dialogs/ExecuteSetupDialog";
import HoneSheet from "@/sheets/types/HoneSheet";
import { createExecutionJob, predictExecutionSeconds } from "@/sheets/executionJobUtil";
import ExecuteDialog from "../dialogs/ExecuteDialog";
import { addNewColumn, createRowNameValues } from "@/sheets/sheetUtil";
import { fixGrammar } from "@/common/englishGrammarUtil";
import { fillTemplate } from "@/persistence/pathUtil";
import { submitPrompt } from "./prompt";
import { isEmpty } from "@/common/stringUtil";
import { parseSimpleResponse } from "@/common/sloppyJsonUtil";
import { describeDuration } from "@/common/timeUtil";
import { errorToast } from "@/components/toasts/toastUtil";

export function setUpExecution(sheet:HoneSheet, promptTemplate:string, setJob:Function, setModalDialog:Function) {
  const nextJob = createExecutionJob(sheet, promptTemplate); // Used as default options.
  setJob(nextJob);
  setModalDialog(ExecuteSetupDialog.name); // Dialog that allows the user to review and edit job options before starting it.
}

export function startExecution(job:ExecutionJob, setJob:Function, setModalDialog:Function) {
  setJob(job); // Used as options to start executing job.
  setModalDialog(ExecuteDialog.name); // Dialog that shows progress during execution. It will call executeJob().
}

export async function executeJob(job:ExecutionJob, setProcessedRowCount:Function, setTimeRemainingText:Function, setResponseText:Function, onComplete:Function) {
  const { promptTemplate, sheet, writeStartRowNo, writeEndRowNo, writeColumnName, onlyOverwriteBlanks, writeExisting, unprocessedRowCount } = job;
  const writeColumnI = writeExisting
    ? sheet.columns.findIndex((column) => column.name === writeColumnName)
    : sheet.columns.length;
  if (writeColumnI === -1) throw Error('Unexpected'); // Passed in bad job data.
  if (!writeExisting) addNewColumn(sheet, writeColumnName);
  
  let processedCount = 0, errorCount = 0;
  
  for(let rowNo = writeStartRowNo; rowNo <= writeEndRowNo; ++rowNo) {
    if (onlyOverwriteBlanks && !isEmpty(sheet.rows[rowNo-1][writeColumnI])) continue;
    const rowNameValues = createRowNameValues(sheet, rowNo);
    const testPrompt = fixGrammar(fillTemplate(promptTemplate, rowNameValues));
    const response = await submitPrompt(testPrompt, setResponseText); // TODO - add retry logic.
    if (response === null) ++errorCount;
    const value = response === null ? '' : parseSimpleResponse(response); // TODO - move parseSimpleResponse() into prompt.ts and out of here and GeneratedText.tsx.
    sheet.rows[rowNo-1][writeColumnI] = value;
    setProcessedRowCount(++processedCount);
    const timeRemainingSeconds = predictExecutionSeconds(unprocessedRowCount - processedCount);
    setTimeRemainingText(describeDuration(timeRemainingSeconds));
  }

  if (errorCount > 0) errorToast(`Due to errors, only ${processedCount} of ${unprocessedRowCount} rows were processed.`);

  onComplete();
}