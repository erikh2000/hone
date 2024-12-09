import { WorkBook } from 'xlsx';
import { useState, useEffect } from 'react';

import ModalDialog from '@/components/modalDialogs/ModalDialog';
import DialogFooter from '@/components/modalDialogs/DialogFooter';
import DialogButton from '@/components/modalDialogs/DialogButton';
import SheetSelector from './SheetSelector';
import SheetView from '../SheetView';

type Props = {
  workbook:WorkBook|null,
  isOpen:boolean,
  onChoose(sheetName:string):void,
  onCancel():void
}

function ImportSheetDialog({workbook, isOpen, onChoose, onCancel}:Props) {
  const [selectedSheetName, setSelectedSheetName] = useState<string>('');

  useEffect(() => {
    if (!isOpen) { setSelectedSheetName(''); return; }
    if (!workbook) throw Error('Unexpected');
    setSelectedSheetName(workbook.SheetNames[0]);
  }, [isOpen, workbook]);

  const sheet = workbook?.Sheets[selectedSheetName] ?? null;
  const sheetPreview = sheet ? <SheetView sheetName={selectedSheetName} sheet={sheet} maxRows={5}/> : null;

  return (
    <ModalDialog isOpen={isOpen} onCancel={onCancel} title="Select Sheet to Import">
      <SheetSelector sheetNames={workbook?.SheetNames || []} selectedSheetName={selectedSheetName} onChange={setSelectedSheetName} />
      {sheetPreview}
      <DialogFooter>
        <DialogButton text="Cancel" onClick={onCancel} />
        <DialogButton text="Import" onClick={() => onChoose(selectedSheetName)} isPrimary />
      </DialogFooter>
    </ModalDialog>
  );
}

export default ImportSheetDialog;