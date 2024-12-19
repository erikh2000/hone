import { useState, useEffect } from "react";

import ExecutionJob from "@/sheets/types/ExecutionJob";
import ModalDialog from "@/components/modalDialogs/ModalDialog";
import DialogFooter from "@/components/modalDialogs/DialogFooter";
import DialogButton from "@/components/modalDialogs/DialogButton";
import { duplicateExecutionJob } from "@/sheets/executionJobUtil";
import styles from './ExecuteSetupDialog.module.css';

type Props = {
  isOpen:boolean,
  defaultOptions:ExecutionJob|null,
  onExecute(job:ExecutionJob):void,
  onCancel():void
}

function ExecuteSetupDialog({isOpen, defaultOptions, onExecute, onCancel}:Props) {
  const [newColumnName, setNewColumnName] = useState<string>('');
  
  useEffect(() => {
    if (!isOpen || !defaultOptions) return;
    setNewColumnName(defaultOptions.writeColumnName);
  }, [isOpen, defaultOptions]);

  if (!defaultOptions || !isOpen) return null;

  const { sheet, jobRowCount, timeRemainingText } = defaultOptions;
  const rowCountText = jobRowCount === 1 ? '1 row' : `${jobRowCount} rows`;

  function _handleExecute() {
    if (!defaultOptions) return;
    const job = duplicateExecutionJob(defaultOptions);
    job.writeColumnName = newColumnName;
    onExecute(job);
  }

  return (
    <ModalDialog isOpen={isOpen} title="Execution Setup" onCancel={onCancel}>
      <p>Get ready to run your prompt across {rowCountText} of the &quot;{sheet.name}&quot; sheet.</p>
      <div className={styles.jobForm}>
        <div className={styles.jobRow}>
          <label>Output to new column: </label>
          <input type="text" value={newColumnName} onChange={(e) => {setNewColumnName(e.target.value)}} />
        </div>
        <div className={styles.jobRow}>
          <label>Predicted time to execute: </label>
          <span>{timeRemainingText}</span>
        </div>
      </div>
      <DialogFooter>
        <DialogButton text="Cancel" onClick={onCancel} />
        <DialogButton text="Execute" onClick={() => _handleExecute()} isPrimary disabled={defaultOptions===null}/>
      </DialogFooter>
    </ModalDialog>
  );
}

export default ExecuteSetupDialog;