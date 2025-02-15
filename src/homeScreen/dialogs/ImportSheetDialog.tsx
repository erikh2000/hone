import { useState, useEffect, useMemo } from 'react';

import ModalDialog from '@/components/modalDialogs/ModalDialog';
import DialogFooter from '@/components/modalDialogs/DialogFooter';
import DialogButton from '@/components/modalDialogs/DialogButton';
import SheetSelector from './SheetSelector';
import HoneSheet from '@/sheets/types/HoneSheet';
import SheetTable from '@/components/sheetTable/SheetTable';
import { GeneratedFooterText } from '@/components/sheetTable/types/GeneratedFooterText';

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

  const columnNames = selectedSheet.columns.map(column => column.name);
  return (
    <ModalDialog isOpen={isOpen} onCancel={onCancel} title="Select Sheet to Import">
      <SheetSelector sheetNames={availableSheetNames} selectedSheetName={selectedSheetName ?? ''} onChange={setSelectedSheetName} />
      <SheetTable columnNames={columnNames} rows={selectedSheet.rows} displayRowCount={5} footerText={GeneratedFooterText.ROW_COUNT}/>
      <DialogFooter>
        <DialogButton text="Cancel" onClick={onCancel} />
        <DialogButton text="Import" onClick={() => { if (selectedSheet) onChoose(selectedSheet, '')}} isPrimary/>
      </DialogFooter>
    </ModalDialog>
  );
}

export default ImportSheetDialog;