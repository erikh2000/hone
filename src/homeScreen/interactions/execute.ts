import ExecutionJob from "@/sheets/types/ExecutionJob";
import ExecuteSetupDialog from "../dialogs/ExecuteSetupDialog";
import HoneSheet from "@/sheets/types/HoneSheet";
import { createExecutionJob, predictExecutionSeconds } from "@/sheets/executionJobUtil";
import ExecuteDialog from "../dialogs/ExecuteDialog";
import { addNewColumn, createRowNameValues, duplicateSheet } from "@/sheets/sheetUtil";
import { fixGrammar } from "@/common/englishGrammarUtil";
import { fillTemplate } from "@/persistence/pathUtil";
import { promptForSimpleResponse } from "./prompt";
import { isEmpty } from "@/common/stringUtil";
import { describeDuration } from "@/common/timeUtil";
import { errorToast } from "@/components/toasts/toastUtil";
import { SIMPLE_RESPONSE_SUPPORTED_TYPES } from "@/common/sloppyJsonUtil";

let cancelExecutionRequested = false;

const MAX_PROMPT_ATTEMPTS = 3;

export function setUpExecution(sheet:HoneSheet, promptTemplate:string, setJob:Function, setModalDialog:Function) {
  const nextJob = createExecutionJob(sheet, promptTemplate); // Used as default options.
  setJob(nextJob);
  setModalDialog(ExecuteSetupDialog.name); // Dialog that allows the user to review and edit job options before starting it.
}

export function startExecution(job:ExecutionJob, setJob:Function, setModalDialog:Function) {
  setJob(job); // Used as options to start executing job.
  setModalDialog(ExecuteDialog.name); // Dialog that shows progress during execution. It will call executeJob().
}

export function cancelExecution(setCancelRequestReceived:Function) {
  setCancelRequestReceived(true);
  cancelExecutionRequested = true;
}

export async function executeJob(job:ExecutionJob, setProcessedRowCount:Function, setCurrentPrompt:Function, 
  setTimeRemainingText:Function, setResponseText:Function, onComplete:Function, onCancel:Function) {
  const { promptTemplate, writeStartRowNo, writeEndRowNo, writeColumnName, onlyOverwriteBlanks, writeExisting, unprocessedRowCount } = job;
  cancelExecutionRequested = false;

  const sheet = duplicateSheet(job.sheet);
  const writeColumnI = writeExisting
    ? sheet.columns.findIndex((column) => column.name === writeColumnName)
    : sheet.columns.length;
  if (writeColumnI === -1) throw Error('Unexpected'); // Passed in bad job data.
  if (!writeExisting) addNewColumn(sheet, writeColumnName);
  
  let processedCount = 0;
  
  for(let rowNo = writeStartRowNo; rowNo <= writeEndRowNo; ++rowNo) {
    if (onlyOverwriteBlanks && !isEmpty(sheet.rows[rowNo-1][writeColumnI])) continue;
    const rowNameValues = createRowNameValues(sheet, rowNo);
    const testPrompt = fixGrammar(fillTemplate(promptTemplate, rowNameValues));
    setProcessedRowCount(processedCount);
    setCurrentPrompt(testPrompt);
    const timeRemainingSeconds = predictExecutionSeconds(unprocessedRowCount - processedCount);
    setTimeRemainingText(describeDuration(timeRemainingSeconds));

    let response:SIMPLE_RESPONSE_SUPPORTED_TYPES = null;
    let attemptNo = 0;
    for(; attemptNo < MAX_PROMPT_ATTEMPTS; ++attemptNo) {
      if (cancelExecutionRequested) { onCancel(sheet, processedCount); return; }
      try {
        response = await promptForSimpleResponse(testPrompt, setResponseText);
        if (response !== null) break;
      } catch (e) {
        console.error(e);
      }
    }
    const value = response === null ? '' : response;
    sheet.rows[rowNo-1][writeColumnI] = value;
    if (attemptNo < MAX_PROMPT_ATTEMPTS) ++processedCount;
  }

  if (processedCount < unprocessedRowCount) errorToast(`Due to errors, only ${processedCount} of ${unprocessedRowCount} rows were processed.`);

  onComplete(sheet);
}