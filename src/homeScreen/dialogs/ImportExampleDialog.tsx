import { useState, useEffect, useMemo } from 'react';

import ModalDialog from '@/components/modalDialogs/ModalDialog';
import DialogFooter from '@/components/modalDialogs/DialogFooter';
import DialogButton from '@/components/modalDialogs/DialogButton';
import SheetSelector from './SheetSelector';
import HoneSheet from '@/sheets/types/HoneSheet';
import SheetTable from '@/components/sheetTable/SheetTable';
import StringMap from '@/common/types/StringMap';
import styles from './ImportExampleDialog.module.css';
import { GeneratedFooterText } from '@/components/sheetTable/types/GeneratedFooterText';

type Props = {
  availableSheets:HoneSheet[],
  isOpen:boolean,
  onChoose(sheet:HoneSheet, defaultPromptTemplate:string):void,
  onCancel():void
}

function _createAvailableSheetNames(availableSheets:HoneSheet[]):string[] {
  return availableSheets.map(sheet => sheet.name).filter(name => !name.startsWith('_'));
}

function _createSheetExplanations(availableSheets:HoneSheet[]):StringMap {
  const explanations:StringMap = {};
  const metaSheet = availableSheets.find(sheet => sheet.name === '_meta');
  if (!metaSheet) return explanations;
  const sheetNameColumnI = metaSheet.columns.findIndex(column => column.name === 'Sheet Name');
  const explanationColumnI = metaSheet.columns.findIndex(column => column.name === 'Explanation');
  if (sheetNameColumnI === -1 || explanationColumnI === -1) return explanations;
  for(let rowI = 0; rowI < metaSheet.rows.length; rowI++) {
    const row = metaSheet.rows[rowI];
    const sheetName = row[sheetNameColumnI];
    const explanation = row[explanationColumnI];
    explanations[sheetName] = explanation;
  }
  return explanations;
}

function _findPromptForSheet(availableSheets:HoneSheet[], sheetName:string|null):string {
  const metaSheet = availableSheets.find(sheet => sheet.name === '_meta');
  if (!metaSheet) return '';
  const sheetNameColumnI = metaSheet.columns.findIndex(column => column.name === 'Sheet Name');
  const promptColumnI = metaSheet.columns.findIndex(column => column.name === 'Default Prompt');
  if (sheetNameColumnI === -1 || promptColumnI === -1) return '';
  const rowI = metaSheet.rows.findIndex(row => row[sheetNameColumnI] === sheetName);
  if (rowI === -1) return '';
  return metaSheet.rows[rowI][promptColumnI];
}

function ImportExampleDialog({availableSheets, isOpen, onChoose, onCancel}:Props) {
  const [selectedSheetName, setSelectedSheetName] = useState<string|null>(null);

  useEffect(() => {
    if (!isOpen) { setSelectedSheetName(''); return; }
    if (!availableSheets.length) throw Error('Unexpected');
    setSelectedSheetName(availableSheets[0].name);
  }, [isOpen, availableSheets]);

  const selectedSheet:HoneSheet|null = useMemo(
    () => availableSheets.find(sheet => sheet.name === selectedSheetName) ?? null, [availableSheets, selectedSheetName]);

  const availableSheetNames = useMemo(() =>_createAvailableSheetNames(availableSheets), [availableSheets]);
  const sheetExplanations = useMemo(() => _createSheetExplanations(availableSheets), [availableSheets]);
  const explanation = selectedSheet ? sheetExplanations[selectedSheet.name] : '';
  
  if (!isOpen || !selectedSheet) return null;

  return (
    <ModalDialog isOpen={isOpen} onCancel={onCancel} title="Select Example Data to Import">
      <SheetSelector sheetNames={availableSheetNames} selectedSheetName={selectedSheetName ?? ''} onChange={setSelectedSheetName} />
      <span className={styles.explanation}>{explanation}</span>
      <SheetTable sheet={selectedSheet} displayRowCount={5} footerText={GeneratedFooterText.ROW_COUNT}/>
      <DialogFooter>
        <DialogButton text="Cancel" onClick={onCancel} />
        <DialogButton text="Import" onClick={() => { if (selectedSheet) onChoose(selectedSheet, _findPromptForSheet(availableSheets, selectedSheetName))}} isPrimary/>
      </DialogFooter>
    </ModalDialog>
  );
}

export default ImportExampleDialog;