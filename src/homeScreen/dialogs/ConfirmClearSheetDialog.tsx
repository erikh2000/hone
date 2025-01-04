import ModalDialog from '@/components/modalDialogs/ModalDialog';
import DialogFooter from '@/components/modalDialogs/DialogFooter';
import DialogButton from '@/components/modalDialogs/DialogButton';
import HoneSheet from '@/sheets/types/HoneSheet';
import { doesSheetHaveWritableColumns } from '@/sheets/sheetUtil';

type Props = {
  sheet:HoneSheet|null,
  isOpen:boolean,
  onConfirm():void,
  onCancel():void
}
function _hasSheetChanged(sheet:HoneSheet):boolean { return doesSheetHaveWritableColumns(sheet); }

function ConfirmClearSheetDialog({sheet, isOpen, onConfirm, onCancel}:Props) {
  if (!isOpen || !sheet) return null;

  const description = _hasSheetChanged(sheet) 
    ? `You added columns to the sheet. Are you sure you want to clear the sheet and lose those changes?` 
    : 'Are you sure you want to clear the sheet?';

  return (
    <ModalDialog isOpen={isOpen} onCancel={onCancel} title="Confirm Clearing Sheet">
      <p>{description}</p>
      <DialogFooter>
        <DialogButton text="Cancel" onClick={onCancel} />
        <DialogButton text="Clear Sheet" onClick={onConfirm} isPrimary/>
      </DialogFooter>
    </ModalDialog>
  );
}

export default ConfirmClearSheetDialog;