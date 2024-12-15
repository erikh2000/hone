import { useEffect, useState } from "react";
import { WorkBook } from 'xlsx';

import styles from './HomeScreen.module.css';
import { init } from "./interactions/initialization";
import ToastPane from "@/components/toasts/ToastPane";
import SheetPane from "./SheetPane";
import ImportSheetDialog from "./dialogs/ImportSheetDialog";
import { onCancelImportSheet, onChangeWorkbook, onSelectSheet } from "./interactions/import";
import PromptPane from "./PromptPane";
import HoneSheet from "@/sheets/types/HoneSheet";

function HomeScreen() {
  
  const [workbook, setWorkbook] = useState<WorkBook|null>(null);
  const [, setWorkbookName] = useState<string>(''); // TODO - use workbookName later for export.
  const [selectedSheet, setSelectedSheet] = useState<HoneSheet|null>(null);
  const [modalDialog, setModalDialog] = useState<string|null>(null);

  useEffect(() => {
    init().then(() => { });
  });

  const promptPaneContent = selectedSheet ? <PromptPane sheet={selectedSheet} className={styles.promptPane} testRowNo={4}/> : null;
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Hone</h1>
      </div>
      <SheetPane 
        workbook={workbook} sheet={selectedSheet} className={styles.sheetPane}
        onChangeWorkbook={(nextWorkbook, nextWorkbookName) => onChangeWorkbook(nextWorkbook, nextWorkbookName, 
          setWorkbook, setWorkbookName, setSelectedSheet, setModalDialog)}
      />
      {promptPaneContent}
      <ToastPane/>
      <ImportSheetDialog workbook={workbook} isOpen={modalDialog === ImportSheetDialog.name} 
        onChoose={(sheet) => onSelectSheet(sheet, setSelectedSheet, setModalDialog)} 
        onCancel={() => onCancelImportSheet(setWorkbook, setWorkbookName, setSelectedSheet, setModalDialog)} 
      />
    </div>
  );
}

export default HomeScreen;