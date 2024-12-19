import { plural } from "@/common/englishGrammarUtil";
import DialogButton from "@/components/modalDialogs/DialogButton";
import DialogFooter from "@/components/modalDialogs/DialogFooter";
import ModalDialog from "@/components/modalDialogs/ModalDialog";
import ExecutionJob from "@/sheets/types/ExecutionJob"

type Props = {
  isOpen:boolean,
  job:ExecutionJob|null,
  onCancel():void,
  onNew():void,
  onResume():void
}

function ResumeJobDialog({isOpen, job, onCancel, onNew, onResume}:Props) {
  if (!isOpen || !job) return null;

  const remainingRowCount = job.jobRowCount - job.processedRowCount;

  return (
    <ModalDialog title="Resume Execution?" isOpen={isOpen} onCancel={onCancel}>
      <p>A previous execution job with {remainingRowCount} {plural("row", remainingRowCount)} to fill on the "{job.writeColumnName}" column was canceled. 
        You can resume that job or start a new one that outputs to a new column.</p>
      <DialogFooter>
        <DialogButton onClick={onCancel} text="Cancel" />
        <DialogButton onClick={onNew} text="New" />
        <DialogButton onClick={onResume} text="Resume" isPrimary/>
      </DialogFooter>
    </ModalDialog>
  );
}

export default ResumeJobDialog;