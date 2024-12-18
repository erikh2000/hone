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
import ExecuteSetupDialog from "./dialogs/ExecuteSetupDialog";
import { 
  startExecution, 
  setUpExecution, 
  checkForPartialDataAfterCancel, 
  completeExecution, 
  keepPartialDataAfterCancel, 
  discardPartialDataAfterCancel 
} from "./interactions/execute";
import ExecutionJob from "@/sheets/types/ExecutionJob";
import ExecuteDialog from "./dialogs/ExecuteDialog";
import { exportSheet } from "./interactions/export";
import KeepPartialDataDialog from "./dialogs/KeepPartialDataDialog";

function HomeScreen() {
  const [workbook, setWorkbook] = useState<WorkBook|null>(null);
  const [, setWorkbookName] = useState<string>(''); // TODO - use workbookName later for export.
  const [selectedSheet, setSelectedSheet] = useState<HoneSheet|null>(null);
  const [selectedRowNo, setSelectedRowNo] = useState<number>(1);
  const [job, setJob] = useState<ExecutionJob|null>(null);
  const [modalDialog, setModalDialog] = useState<string|null>(null);

  useEffect(() => {
    init().then(() => { });
  });

  const promptPaneContent = selectedSheet ? 
    <PromptPane 
      sheet={selectedSheet} className={styles.promptPane} 
      testRowNo={selectedRowNo} 
      onExecute={promptTemplate => setUpExecution(selectedSheet, promptTemplate, setJob, setModalDialog)}
    /> : null;
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Hone</h1>
      </div>
      <SheetPane 
        workbook={workbook} sheet={selectedSheet} className={styles.sheetPane} selectedRowNo={selectedRowNo} 
        onRowSelect={setSelectedRowNo}
        onChangeWorkbook={(nextWorkbook, nextWorkbookName) => onChangeWorkbook(nextWorkbook, nextWorkbookName, 
          setWorkbook, setWorkbookName, setSelectedSheet, setModalDialog)}
        onExportSheet={() => exportSheet(setModalDialog)}
      />
      {promptPaneContent}
      <ImportSheetDialog workbook={workbook} isOpen={modalDialog === ImportSheetDialog.name} 
        onChoose={(sheet) => onSelectSheet(sheet, setSelectedSheet, setModalDialog)} 
        onCancel={() => onCancelImportSheet(setWorkbook, setWorkbookName, setSelectedSheet, setModalDialog)} 
      />
      <ExecuteSetupDialog isOpen={modalDialog === ExecuteSetupDialog.name} defaultOptions={job}  
        onExecute={(nextJob) => {startExecution(nextJob, setJob, setModalDialog)}}
        onCancel={() => {setModalDialog(null)}}
      />
      <ExecuteDialog isOpen={modalDialog === ExecuteDialog.name} job={job} onUpdateJob={setJob}
        onCancel={(completedJob) => checkForPartialDataAfterCancel(completedJob, setJob, setModalDialog)} 
        onComplete={(completedJob) => completeExecution(completedJob, setSelectedSheet, setJob, setModalDialog)} 
      />
      <KeepPartialDataDialog isOpen={modalDialog === KeepPartialDataDialog.name} 
        processedRowCount={job?.processedRowCount || 0}
        onKeep={() => keepPartialDataAfterCancel(job, setSelectedSheet, setJob, setModalDialog)}
        onDiscard={() => discardPartialDataAfterCancel(setJob, setModalDialog)}
      />
      <ToastPane/>
    </div>
  );
}

export default HomeScreen;