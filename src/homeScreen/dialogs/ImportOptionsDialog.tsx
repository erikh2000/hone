import { useState, useEffect } from "react";

import styles from './ImportOptionsDialog.module.css';
import DialogButton from "@/components/modalDialogs/DialogButton";
import DialogFooter from "@/components/modalDialogs/DialogFooter";
import ModalDialog from "@/components/modalDialogs/ModalDialog";
import ImportOptions from "@/homeScreen/types/ImportOptions";
import ImportType from "../types/ImportType";
import Selector from "@/components/selector/Selector";
import Checkbox from "@/components/checkbox/Checkbox";
import HoneSheet from "@/sheets/types/HoneSheet";
import { doesSheetHaveWritableColumns } from "@/sheets/sheetUtil";
import DialogTextInput from "@/components/modalDialogs/DialogTextInput";

const IMPORT_TYPE_OPTIONS:string[] = ['Example', 'Excel', 'CSV', 'Clipboard'];

const IMPORT_EXPLANATIONS:string[] = [
  'You can import one of the available example sheets - a good option for trying out Hone quickly!',
  'You can import your sheet from an Excel file on your device.',
  'You can import your sheet from a CSV file on your device.',
  'You can copy cells from other spreadsheet software and paste them here.'
];

const IMPORT_BUTTON_NAMES:string[] = [
  'Choose Example', 'Choose File', 'Choose File', 'Paste'
];

type Props = {
  isOpen:boolean,
  sheet:HoneSheet|null,
  onImport(importOptions:ImportOptions):void,
  onCancel():void
}

function _isModifiedSheet(sheet:HoneSheet|null):boolean {
  return sheet ? doesSheetHaveWritableColumns(sheet) : false;
}

function ImportOptionsDialog({isOpen, onImport, onCancel, sheet}:Props) {
  const [importOptions, setImportOptions] = useState<ImportOptions|null>(null);

  useEffect(() => {
      if (!isOpen) return;
      if (!importOptions) setImportOptions({ sheetName:'Default', importType:ImportType.EXAMPLE, useFirstRowColumnNames:true });
    }, [isOpen]);

  if (!isOpen || !importOptions) return null;

  const replaceWarning = !_isModifiedSheet(sheet) ? null 
    : <p className={styles.replaceWarning}><em>Warning:</em> This will replace the current sheet and the columns you added to it.</p>;
  const explanation = IMPORT_EXPLANATIONS[importOptions.importType];
  const importButtonName = IMPORT_BUTTON_NAMES[importOptions.importType];
  const sheetNameInput = importOptions.importType !== ImportType.CLIPBOARD ? null
    : <DialogTextInput labelText="Sheet Name:" value={importOptions.sheetName} onChangeText={sheetName => setImportOptions({...importOptions, sheetName})} />;
  const useFirstRowColumnNames = importOptions.importType === ImportType.EXAMPLE ? null
    :  <Checkbox label="Use first row as column names" isChecked={importOptions.useFirstRowColumnNames}  
    onChange={useFirstRowColumnNames => setImportOptions({...importOptions, useFirstRowColumnNames}) } />
  const importOptionsSection = sheetNameInput === null && useFirstRowColumnNames === null ? null 
    : (
    <label className={styles.importOptions}>
      Import options:
      {sheetNameInput}
      {useFirstRowColumnNames}
    </label>);

  return (
    <ModalDialog title="Import Sheet" isOpen={isOpen} onCancel={onCancel}>
      {replaceWarning}
      <Selector label="Import from" optionNames={IMPORT_TYPE_OPTIONS} selectedOptionNo={importOptions.importType} 
        onChange={importType => setImportOptions({...importOptions, importType}) } />
      <p className={styles.explanation}>{explanation}</p>
      {importOptionsSection}
      <DialogFooter>
        <DialogButton text="Cancel" onClick={() => onCancel()} />
        <DialogButton text={importButtonName} onClick={() => {if (importOptions) onImport(importOptions)}} isPrimary />
      </DialogFooter>
    </ModalDialog>
  );
}

export default ImportOptionsDialog;