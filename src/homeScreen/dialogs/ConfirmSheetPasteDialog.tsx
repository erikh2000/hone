import ModalDialog from '@/components/modalDialogs/ModalDialog';
import DialogFooter from '@/components/modalDialogs/DialogFooter';
import DialogButton from '@/components/modalDialogs/DialogButton';
import HoneSheet from '@/sheets/types/HoneSheet';
import { doesSheetHaveWritableColumns } from '@/sheets/sheetUtil';
import SheetTable from '@/components/sheetTable/SheetTable';
import { GeneratedFooterText } from '@/components/sheetTable/types/GeneratedFooterText';

type Props = {
  pastedSheet:HoneSheet|null,
  existingSheet:HoneSheet|null,
  isOpen:boolean,
  onConfirm(sheet:HoneSheet):void,
  onCancel():void
}

function _getUiTextAffectedByExistingSheet(existingSheet:HoneSheet|null):{confirmButtonText:string, description:string} {
  if (!existingSheet) return {confirmButtonText:'Import', description:'Import this sheet into Hone?'};
  let description = `Replace "${existingSheet.name}" sheet with this new pasted sheet?`;
  if (doesSheetHaveWritableColumns(existingSheet)) description += ' You will discard any added columns.';
  return {confirmButtonText:'Replace', description};
}

function ConfirmSheetPasteDialog({pastedSheet, existingSheet, isOpen, onConfirm, onCancel}:Props) {
  if (!isOpen || !pastedSheet) return null;

  const {confirmButtonText, description} = _getUiTextAffectedByExistingSheet(existingSheet);
  const columnNames = pastedSheet.columns.map(column => column.name);

  return (
    <ModalDialog isOpen={isOpen} onCancel={onCancel} title="Confirm Sheet Paste">
      <p>{description}</p>
      <SheetTable columnNames={columnNames} rows={pastedSheet.rows} displayRowCount={5} footerText={GeneratedFooterText.ROW_COUNT}/>
      <DialogFooter>
        <DialogButton text="Cancel" onClick={onCancel} />
        <DialogButton text={confirmButtonText} onClick={() => { if (pastedSheet) onConfirm(pastedSheet)}} isPrimary/>
      </DialogFooter>
    </ModalDialog>
  );
}

export default ConfirmSheetPasteDialog;