import { WorkBook } from 'xlsx';
import { useState, useEffect } from 'react';

import ModalDialog from '@/components/modalDialogs/ModalDialog';
import DialogFooter from '@/components/modalDialogs/DialogFooter';
import DialogButton from '@/components/modalDialogs/DialogButton';
import SheetSelector from './SheetSelector';
import SheetView from '../SheetView';
import HoneSheet from '@/sheets/types/HoneSheet';
import { createHoneSheet } from '@/sheets/sheetUtil';

type Props = {
  workbook:WorkBook|null,
  isOpen:boolean,
  onChoose(sheet:HoneSheet):void,
  onCancel():void
}

function ImportSheetDialog({workbook, isOpen, onChoose, onCancel}:Props) {
  const [selectedSheetName, setSelectedSheetName] = useState<string|null>(null);
  const [selectedSheet, setSelectedSheet] = useState<HoneSheet>();

  useEffect(() => {
    if (!isOpen) { setSelectedSheetName(''); return; }
    if (!workbook || !workbook.SheetNames.length) throw Error('Unexpected');
    setSelectedSheetName(workbook.SheetNames[0]);
  }, [isOpen, workbook]);

  useEffect(() => {
    if (!workbook || !selectedSheetName) return;
    const nextSheet = createHoneSheet(workbook, selectedSheetName);
    setSelectedSheet(nextSheet);
  }, [selectedSheetName, workbook]);

  const sheetPreview = selectedSheet ? <SheetView sheet={selectedSheet} maxRows={5} padToMax={true}/> : null;

  return (
    <ModalDialog isOpen={isOpen} onCancel={onCancel} title="Select Sheet to Import">
      <SheetSelector sheetNames={workbook?.SheetNames || []} selectedSheetName={selectedSheetName ?? ''} onChange={setSelectedSheetName} />
      {sheetPreview}
      <DialogFooter>
        <DialogButton text="Cancel" onClick={onCancel} />
        <DialogButton text="Import" onClick={() => { if (selectedSheet) onChoose(selectedSheet)}} isPrimary disabled={selectedSheet===null}/>
      </DialogFooter>
    </ModalDialog>
  );
}

export default ImportSheetDialog;