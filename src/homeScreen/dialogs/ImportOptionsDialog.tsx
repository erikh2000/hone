import { useState, useEffect } from "react";

import styles from './ImportOptionsDialog.module.css';
import DialogButton from "@/components/modalDialogs/DialogButton";
import DialogFooter from "@/components/modalDialogs/DialogFooter";
import ModalDialog from "@/components/modalDialogs/ModalDialog";
import ImportOptions from "@/homeScreen/types/ImportOptions";
import ImportType from "../types/ImportType";
import Selector from "@/components/selector/Selector";
import Checkbox from "@/components/checkbox/Checkbox";

const IMPORT_TYPE_OPTIONS:string[] = ['Excel', 'CSV', 'Clipboard'];

const IMPORT_EXPLANATIONS:string[] = [
  'You can import your sheet from an Excel file on your device.',
  'You can import your sheet from a CSV file on your device.',
  'You can copy cells from other spreadsheet software and paste them here.'
];

type Props = {
  isOpen:boolean,
  onImport(importOptions:ImportOptions):void,
  onCancel():void
}

function ImportOptionsDialog({isOpen, onImport, onCancel}:Props) {
  const [importOptions, setImportOptions] = useState<ImportOptions|null>(null);

  useEffect(() => {
      if (!isOpen) return;
      if (!importOptions) setImportOptions({ importType:ImportType.CLIPBOARD, useFirstRowColumnNames:true });
    }, [isOpen]);

  if (!isOpen || !importOptions) return null;

  const explanation = IMPORT_EXPLANATIONS[importOptions.importType];
  const importButtonName = importOptions.importType === ImportType.CLIPBOARD ? 'Paste' : 'Choose File';

  return (
    <ModalDialog title="Import Sheet" isOpen={isOpen} onCancel={onCancel}>
      <Selector label="Import from" optionNames={IMPORT_TYPE_OPTIONS} selectedOptionNo={importOptions.importType} 
        onChange={importType => setImportOptions({...importOptions, importType}) } />
      <p className={styles.explanation}>{explanation}</p>
      <label className={styles.importOptions}>
        Import options:
        <Checkbox label="Use first row as column names" isChecked={importOptions.useFirstRowColumnNames}  
          onChange={useFirstRowColumnNames => setImportOptions({...importOptions, useFirstRowColumnNames}) } />
      </label>
      <DialogFooter>
        <DialogButton text="Cancel" onClick={() => onCancel()} />
        <DialogButton text={importButtonName} onClick={() => {if (importOptions) onImport(importOptions)}} isPrimary />
      </DialogFooter>
    </ModalDialog>
  );
}

export default ImportOptionsDialog;