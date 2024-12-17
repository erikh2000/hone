import { useState, useEffect } from "react";

import DialogFooter from "@/components/modalDialogs/DialogFooter";
import ModalDialog from "@/components/modalDialogs/ModalDialog";
import ExecutionJob from "@/sheets/types/ExecutionJob";
import ProgressBar from "@/components/progressBar/ProgressBar";
import styles from './ExecuteDialog.module.css';
import { cancelExecution, executeJob } from "../interactions/execute";
import GeneratedText from "@/components/generatedText/GeneratedText";
import { plural } from "@/common/englishGrammarUtil";
import HoneSheet from "@/sheets/types/HoneSheet";
import WaitingEllipsis from "@/components/waitingEllipsis/WaitingEllipsis";
import DialogButton from "@/components/modalDialogs/DialogButton";

type Props = {
  onCancel(sheet:HoneSheet, processedRowCount:number):void,
  onComplete(sheet:HoneSheet):void,
  isOpen:boolean,
  job:ExecutionJob|null
}

function ExecuteDialog({onCancel, isOpen, job, onComplete}:Props) {
  const [totalRowCount, setTotalRowCount] = useState<number>(0);
  const [processedRowCount, setProcessedRowCount] = useState<number>(0);
  const [timeRemainingText, setTimeRemainingText] = useState<string>('');
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [responseText, setResponseText] = useState<string>('');
  const [cancelRequestReceived, setCancelRequestReceived] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !job) { setCancelRequestReceived(false); setProcessedRowCount(0); return; }
    setTotalRowCount(job.unprocessedRowCount);
    executeJob(job, setProcessedRowCount, setCurrentPrompt, setTimeRemainingText, setResponseText, onComplete, onCancel);
  }, [isOpen, job]);

  if (!isOpen || !job || !totalRowCount) return null;

  const percentComplete = processedRowCount / totalRowCount;

  const status = cancelRequestReceived 
    ? <p>Cancelling job.</p> 
    : <p>Updating {processedRowCount+1} of {totalRowCount} {plural("row", totalRowCount)} in &quot;{job.sheet.name}&quot; sheet.</p>

  const middleContent = cancelRequestReceived 
    ? <p>One moment<WaitingEllipsis trailing/></p>
    : <>
      <p>Current prompt: "{currentPrompt}"</p>
      <p>Response: <GeneratedText text={responseText} /></p>
      <p>Time remaining:{timeRemainingText}</p>
    </>

  return (
    <ModalDialog title="Executing" onCancel={() => cancelExecution(setCancelRequestReceived)} isOpen={isOpen}>
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