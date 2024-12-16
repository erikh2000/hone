import { useState, useEffect } from "react";

import DialogFooter from "@/components/modalDialogs/DialogFooter";
import ModalDialog from "@/components/modalDialogs/ModalDialog";
import ExecutionJob from "@/sheets/types/ExecutionJob";
import ProgressBar from "@/components/progressBar/ProgressBar";
import styles from './ExecuteDialog.module.css';
import { executeJob } from "../interactions/execute";

type Props = {
  onCancel():void,
  onComplete():void,
  isOpen:boolean,
  job:ExecutionJob|null
}

function ExecuteDialog({onCancel, isOpen, job, onComplete}:Props) {
  const [totalRowCount, setTotalRowCount] = useState<number>(0);
  const [processedRowCount, setProcessedRowCount] = useState<number>(0);
  const [timeRemainingText, setTimeRemainingText] = useState<string>('');
  const [responseText, setResponseText] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !job) { setProcessedRowCount(0); return; }
    setTotalRowCount(job.unprocessedRowCount);
    executeJob(job, setProcessedRowCount, setTimeRemainingText, setResponseText, onComplete);
  }, [isOpen, job]);

  if (!isOpen || !job || !totalRowCount) return null;

  const percentComplete = Math.round((processedRowCount / totalRowCount) * 100);

  // TODO add a view of the currently executing prompt and response generated.
  return (
    <ModalDialog title="Executing" onCancel={onCancel} isOpen={isOpen}>
      <p>Running your prompt against &quot;{job.sheet.name}&quot; sheet.</p>
      <div className={styles.progress}>
        <ProgressBar percentComplete={percentComplete} />
      </div>
      <p>Response:{responseText}</p>
      <p>Time remaining:{timeRemainingText}</p>
      <DialogFooter>
        <button onClick={() => onCancel()}>Cancel</button>
      </DialogFooter>
    </ModalDialog>
  );
}

export default ExecuteDialog;