import ExecutionJob from "@/sheets/types/ExecutionJob";
import ExecuteSetupDialog from "../dialogs/ExecuteSetupDialog";
import HoneSheet from "@/sheets/types/HoneSheet";
import { createExecutionJob, duplicateExecutionJob, predictExecutionSeconds } from "@/sheets/executionJobUtil";
import ExecuteDialog from "../dialogs/ExecuteDialog";
import { addNewColumn, createRowNameValues, duplicateSheet } from "@/sheets/sheetUtil";
import { fixGrammar } from "@/common/englishGrammarUtil";
import { fillTemplate } from "@/persistence/pathUtil";
import { promptForSimpleResponse } from "./prompt";
import { isEmpty } from "@/common/stringUtil";
import { describeDuration } from "@/common/timeUtil";
import { errorToast } from "@/components/toasts/toastUtil";
import { SIMPLE_RESPONSE_SUPPORTED_TYPES } from "@/common/sloppyJsonUtil";
import KeepPartialDataDialog from "../dialogs/KeepPartialDataDialog";

let cancelExecutionRequested = false;

const MAX_PROMPT_ATTEMPTS = 2; // Using a seed, so there's just not much hope in trying more than twice.

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

let isJobExecuting = false;

export function isExecuting() { return isJobExecuting; }

export async function executeJob(startingJob:ExecutionJob, setJob:Function, setResponseText:Function, onComplete:Function, onCancel:Function) {
  if (isJobExecuting) throw Error('Unexpected'); // Shouldn't be called while another job is executing.
  isJobExecuting = true;

  try {
    const { promptTemplate, writeStartRowNo, writeEndRowNo, writeColumnName, onlyOverwriteBlanks, writeExisting, jobRowCount } = startingJob; // read-only values.

    cancelExecutionRequested = false;
    let job = duplicateExecutionJob(startingJob);
    job.sheet = duplicateSheet(job.sheet);
    const writeColumnI = writeExisting
      ? job.sheet.columns.findIndex((column) => column.name === writeColumnName)
      : job.sheet.columns.length;
    if (writeColumnI === -1) throw Error('Unexpected'); // Passed in bad job data.
    if (!writeExisting) addNewColumn(job.sheet, writeColumnName);
    
    for(let rowNo = writeStartRowNo; rowNo <= writeEndRowNo; ++rowNo) {
      if (onlyOverwriteBlanks && !isEmpty(job.sheet.rows[rowNo-1][writeColumnI])) continue;

      // Update row-specific values of job.
      const rowNameValues = createRowNameValues(job.sheet, rowNo);
      job.currentPrompt = fixGrammar(fillTemplate(promptTemplate, rowNameValues));
      const timeRemainingSeconds = predictExecutionSeconds(jobRowCount - job.processedRowCount);
      job.timeRemainingText = describeDuration(timeRemainingSeconds);

      setJob(job); // Update any UI with the latest job data.
      job = duplicateExecutionJob(job); // Fresh instance for update on next iteration.

      let response:SIMPLE_RESPONSE_SUPPORTED_TYPES = null;
      let attemptI = 0;
      for(; attemptI < MAX_PROMPT_ATTEMPTS; ++attemptI) {
        if (cancelExecutionRequested) { onCancel(job); return; }
        try {
          response = await promptForSimpleResponse(job.currentPrompt, setResponseText);
          if (response !== null) break;
        } catch (e) {
          console.error(e);
        }
      }
      const value = response === null ? '' : response;
      job.sheet.rows[rowNo-1][writeColumnI] = value;
      if (attemptI < MAX_PROMPT_ATTEMPTS) ++(job.processedRowCount);
    }

    if (job.processedRowCount < jobRowCount) errorToast(`Due to errors, only ${job.processedRowCount} of ${jobRowCount} rows were processed.`);

    setJob(job);
    onComplete(job);
  } finally {
    isJobExecuting = false;
  }
}

export function checkForPartialDataAfterCancel(job:ExecutionJob|null, setJob:Function, setModalDialog:Function) {
  if (!job) throw Error('Unexpected');
  if (job.processedRowCount) { setModalDialog(KeepPartialDataDialog.name); return; }
  setJob(null); // No rows changed, but also abandoning any column changes.
  setModalDialog(null); 
}

export function completeExecution(job:ExecutionJob|null, setSelectedSheet:Function, setJob:Function, setModalDialog:Function) {
  if (!job) throw Error('Unexpected');
  setSelectedSheet(job.sheet);
  setJob(null);
  setModalDialog(null);
}

export function keepPartialDataAfterCancel(job:ExecutionJob|null, setSelectedSheet:Function, setJob:Function, setModalDialog:Function) {
  if (!job) throw Error('Unexpected');
  setSelectedSheet(job.sheet);
  setJob(null);
  setModalDialog(null);
}

export function discardPartialDataAfterCancel(setJob:Function, setModalDialog:Function) {
  setJob(null);
  setModalDialog(null);
}