import { plural } from "@/common/englishGrammarUtil";
import ConfirmCancelDialog from "@/components/modalDialogs/ConfirmCancelDialog";

type Props = {
  isOpen:boolean,
  processedRowCount:number,
  onKeep:()=>void,
  onDiscard:()=>void
}

function KeepPartialDataDialog({isOpen, processedRowCount, onKeep, onDiscard}:Props) {
  return (
    <ConfirmCancelDialog 
      title="Keep Changes?" isOpen={isOpen} confirmText="Keep" onConfirm={onKeep} onCancel={onDiscard} cancelText="Discard"
      description={`You have processed ${processedRowCount} ${plural("row", processedRowCount)}. Keep these changes in your sheet?`} 
    />
  );
}

export default KeepPartialDataDialog;