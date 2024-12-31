import { useState, useEffect, useMemo } from 'react';

import ModalDialog from '@/components/modalDialogs/ModalDialog';
import DialogFooter from '@/components/modalDialogs/DialogFooter';
import DialogButton from '@/components/modalDialogs/DialogButton';
import SheetSelector from './SheetSelector';
import HoneSheet from '@/sheets/types/HoneSheet';
import SheetTable, { GeneratedFooterText } from '@/components/sheetTable/SheetTable';

type Props = {
  availableSheets:HoneSheet[],
  isOpen:boolean,
  onChoose(sheet:HoneSheet, defaultPromptTemplate:string):void,
  onCancel():void
}

function ImportSheetDialog({availableSheets, isOpen, onChoose, onCancel}:Props) {
  const [selectedSheetName, setSelectedSheetName] = useState<string|null>(null);

  useEffect(() => {
    if (!isOpen) { setSelectedSheetName(''); return; }
    if (!availableSheets.length) throw Error('Unexpected');
    setSelectedSheetName(availableSheets[0].name);
  }, [isOpen, availableSheets]);

  const selectedSheet:HoneSheet|null = useMemo(
    () => availableSheets.find(sheet => sheet.name === selectedSheetName) ?? null, [availableSheets, selectedSheetName]);

  const availableSheetNames = useMemo(() => availableSheets.map(sheet => sheet.name), [availableSheets]);
  
  if (!isOpen || !selectedSheet) return null;

  return (
    <ModalDialog isOpen={isOpen} onCancel={onCancel} title="Select Sheet to Import">
      <SheetSelector sheetNames={availableSheetNames} selectedSheetName={selectedSheetName ?? ''} onChange={setSelectedSheetName} />
      <SheetTable sheet={selectedSheet} displayRowCount={5} footerText={GeneratedFooterText.ROW_COUNT}/>
      <DialogFooter>
        <DialogButton text="Cancel" onClick={onCancel} />
        <DialogButton text="Import" onClick={() => { if (selectedSheet) onChoose(selectedSheet, '')}} isPrimary/>
      </DialogFooter>
    </ModalDialog>
  );
}

export default ImportSheetDialog;