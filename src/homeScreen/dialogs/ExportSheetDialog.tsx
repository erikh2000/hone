import styles from './ExportSheetDialog.module.css';
import DialogButton from "@/components/modalDialogs/DialogButton";
import DialogFooter from "@/components/modalDialogs/DialogFooter";
import ModalDialog from "@/components/modalDialogs/ModalDialog";
import Selector from "@/components/selector/Selector";
import { useEffect, useState } from "react";
import ColumnChecklist from '@/components/columnChecklist/ColumnCheckList';
import HoneSheet from '@/sheets/types/HoneSheet';
import Checkbox from '@/components/checkbox/Checkbox';
import ExportOptions from '../types/ExportOptions';
import { createExportOptionsForSheet } from '../interactions/export';
import ExportType from '../types/ExportType';

const EXPORT_TYPE_OPTIONS:string[] = ['Excel', 'CSV', 'Clipboard'];

const EXPORT_EXPLANATIONS:string[] = [
  'You can save your sheet as an XLSX file to your computer and open it later in Excel or other spreadsheet software.',
  'You can save your sheet as a CSV file to your computer and open it later in any spreadsheet software.',
  'You can copy your sheet to the clipboard and paste it into any spreadsheet software or text editor.'
];

type Props = {
  isOpen:boolean,
  sheet:HoneSheet|null,
  onExport(sheet:HoneSheet, exportOptions:ExportOptions):void,
  onCancel():void
}

function ExportSheetDialog({sheet, isOpen, onExport, onCancel}:Props) {
  const [exportOptions, setExportOptions] = useState<ExportOptions|null>(null);

  useEffect(() => {
    if (!isOpen || !sheet) return;
    setExportOptions(createExportOptionsForSheet(sheet));
  }, [isOpen, sheet]);

  if (!isOpen || !sheet || !exportOptions) return null;

  const explanation = EXPORT_EXPLANATIONS[exportOptions.exportType];
  const isContinueDisabled = !exportOptions.includeColumnNos.length || (!exportOptions.includeHeaders && sheet.rows.length === 0);
  const includeHeaders = exportOptions.exportType === ExportType.CSV ? true : exportOptions.includeHeaders;

  return (
    <ModalDialog title="Export Sheet" isOpen={isOpen} onCancel={onCancel}>
      <Selector label="Export to" optionNames={EXPORT_TYPE_OPTIONS} selectedOptionNo={exportOptions.exportType} 
        onChange={exportType => setExportOptions({...exportOptions, exportType}) } />
      <p className={styles.explanation}>{explanation}</p>
      <label className={styles.exportOptions}>
        Export options:
        <Checkbox label="Include headers" isChecked={includeHeaders} disabled={exportOptions.exportType === ExportType.CSV} 
        onChange={includeHeaders => setExportOptions({...exportOptions, includeHeaders}) } />
      </label>
      <ColumnChecklist sheet={sheet} selectedColumnNos={exportOptions.includeColumnNos} 
        onChange={includeColumnNos => setExportOptions({...exportOptions, includeColumnNos}) } />
      <DialogFooter>
        <DialogButton text="Cancel" onClick={() => onCancel()} />
        <DialogButton text="Continue" onClick={() => onExport(sheet, exportOptions)} disabled={isContinueDisabled} isPrimary />
      </DialogFooter>
    </ModalDialog>
  );
}

export default ExportSheetDialog;