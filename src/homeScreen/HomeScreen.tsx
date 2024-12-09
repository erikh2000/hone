import { useEffect, useState } from "react";
import { WorkBook } from 'xlsx';

import styles from './HomeScreen.module.css';
import { init } from "./interactions/initialization";
import ToastPane from "@/components/toasts/ToastPane";
import SheetPane from "./SheetPane";
import ImportSheetDialog from "./dialogs/ImportSheetDialog";
import { onCancelImportSheet, onChangeWorkbook, onSelectSheet } from "./interactions/import";

function HomeScreen() {
  
  const [workbook, setWorkbook] = useState<WorkBook|null>(null);
  const [, setWorkbookName] = useState<string>(''); // TODO - use workbookName later for export.
  const [selectedSheetName, setSelectedSheetName] = useState<string>('');
  const [modalDialog, setModalDialog] = useState<string|null>(null);

  useEffect(() => {
    init().then(() => { });
  });
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Hone</h1>
      </div>
      <SheetPane 
        workbook={workbook} sheetName={selectedSheetName} className={styles.content}
        onChangeWorkbook={(nextWorkbook, nextWorkbookName) => onChangeWorkbook(nextWorkbook, nextWorkbookName, 
          setWorkbook, setWorkbookName, setSelectedSheetName, setModalDialog)}
      />
      <ToastPane/>
      <ImportSheetDialog workbook={workbook} isOpen={modalDialog === ImportSheetDialog.name} 
        onChoose={(sheetName) => onSelectSheet(sheetName, setSelectedSheetName, setModalDialog)} 
        onCancel={() => onCancelImportSheet(setWorkbook, setWorkbookName, setSelectedSheetName, setModalDialog)} 
      />
    </div>
  );
}

export default HomeScreen;