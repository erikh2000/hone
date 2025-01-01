import { useState, useEffect } from "react";

import DialogFooter from "@/components/modalDialogs/DialogFooter";
import ModalDialog from "@/components/modalDialogs/ModalDialog";
import ExecutionJob from "@/sheets/types/ExecutionJob";
import ProgressBar from "@/components/progressBar/ProgressBar";
import styles from './ExecuteDialog.module.css';
import { cancelExecution, executeJob, isExecuting } from "../interactions/execute";
import GeneratedText from "@/components/generatedText/GeneratedText";
import { plural } from "@/common/englishGrammarUtil";
import WaitingEllipsis from "@/components/waitingEllipsis/WaitingEllipsis";
import DialogButton from "@/components/modalDialogs/DialogButton";

type Props = {
  onCancel(completedJob:ExecutionJob):void,
  onComplete(completedJob:ExecutionJob):void,
  onUpdateJob(job:ExecutionJob):void,
  isOpen:boolean,
  job:ExecutionJob|null
}

function ExecuteDialog({onCancel, isOpen, job, onComplete, onUpdateJob}:Props) {
  const [responseText, setResponseText] = useState<string>('');
  const [cancelRequestReceived, setCancelRequestReceived] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !job) { setCancelRequestReceived(false); return; }
    if (isExecuting()) return;
    executeJob(job, onUpdateJob, setResponseText, onComplete, onCancel);
  }, [isOpen, job]);

  if (!isOpen || !job || !job.jobRowCount) return null;

  const percentComplete = job.processedRowCount / job.jobRowCount;

  const status = cancelRequestReceived 
    ? <p>Cancelling job.</p> 
    : <p>Updating {job.processedRowCount+1} of {job.jobRowCount} {plural("row", job.jobRowCount)} in &quot;{job.sheet.name}&quot; sheet.</p>

  const middleContent = cancelRequestReceived 
    ? <p>One moment<WaitingEllipsis trailing/></p>
    : <>
      <p>Current prompt: <span className={styles.prompt}>{job.currentPrompt}</span></p>
      <p>Response: <GeneratedText text={responseText} /></p>
      <p>Time remaining: {job.timeRemainingText}</p>
    </>

  return ( // Intentionally not passing "onCancel" to ModalDialog as I don't want a click-away to cancel the job. User must click the "cancel" button.
    <ModalDialog title="Executing" isOpen={isOpen}>
      {status}
      <div className={styles.progress}>
        <ProgressBar percentComplete={percentComplete} />
      </div>
      {middleContent}
      <DialogFooter>
        <DialogButton onClick={() => cancelExecution(setCancelRequestReceived)} text="cancel" disabled={cancelRequestReceived}/>
      </DialogFooter>
    </ModalDialog>
  );
}

export default ExecuteDialog;