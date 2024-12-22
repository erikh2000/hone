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
import { chooseExportType, exportSheet } from "./interactions/export";
import KeepPartialDataDialog from "./dialogs/KeepPartialDataDialog";
import ResumeJobDialog from "./dialogs/ResumeJobDialog";
import ExportOptionsDialog from "./dialogs/ExportOptionsDialog";

function HomeScreen() {
  const [workbook, setWorkbook] = useState<WorkBook|null>(null);
  const [, setWorkbookName] = useState<string>(''); // TODO - use workbookName later for export.
  const [sheet, setSheet] = useState<HoneSheet|null>(null);
  const [selectedRowNo, setSelectedRowNo] = useState<number>(1);
  const [job, setJob] = useState<ExecutionJob|null>(null);
  const [modalDialog, setModalDialog] = useState<string|null>(null);
  const [promptTemplate, setPromptTemplate] = useState<string>('');

  useEffect(() => {
    init().then(() => { });
  });

  const promptPaneContent = sheet ? 
    <PromptPane 
      sheet={sheet} className={styles.promptPane} 
      testRowNo={selectedRowNo} 
      onExecute={promptTemplate => setUpExecution(job, sheet, promptTemplate, setPromptTemplate, setJob, setModalDialog)}
    /> : null;
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Hone</h1>
      </div>
      <SheetPane 
        workbook={workbook} sheet={sheet} className={styles.sheetPane} selectedRowNo={selectedRowNo} 
        onRowSelect={setSelectedRowNo}
        onChangeWorkbook={(nextWorkbook, nextWorkbookName) => onChangeWorkbook(nextWorkbook, nextWorkbookName, 
          setWorkbook, setWorkbookName, setSheet, setModalDialog)}
        onExportSheet={() => chooseExportType(setModalDialog)}
      />
      {promptPaneContent}

      <ImportSheetDialog workbook={workbook} isOpen={modalDialog === ImportSheetDialog.name} 
        onChoose={(sheet) => onSelectSheet(sheet, setSheet, setModalDialog)} 
        onCancel={() => onCancelImportSheet(setWorkbook, setWorkbookName, setSheet, setModalDialog)} 
      />
      
      <ResumeJobDialog isOpen={modalDialog === ResumeJobDialog.name} job={job}  
        onCancel={() => {setModalDialog(null)}}
        onResume={() => {setModalDialog(ExecuteDialog.name)}}
        onNew={() => {setJob(null); if(sheet) setUpExecution(null, sheet, promptTemplate, setPromptTemplate, setJob, setModalDialog)}} // TODO - either refactor into an interaction or move to your columnwise UI design.
      />

      <ExecuteSetupDialog isOpen={modalDialog === ExecuteSetupDialog.name} defaultOptions={job}  
        onExecute={(nextJob) => {startExecution(nextJob, setJob, setModalDialog)}}
        onCancel={() => {setModalDialog(null)}}
      />

      <ExecuteDialog isOpen={modalDialog === ExecuteDialog.name} job={job} onUpdateJob={setJob}
        onCancel={(completedJob) => checkForPartialDataAfterCancel(completedJob, setJob, setModalDialog)} 
        onComplete={(completedJob) => completeExecution(completedJob, setSheet, setJob, setModalDialog)} 
      />

      <KeepPartialDataDialog isOpen={modalDialog === KeepPartialDataDialog.name} 
        processedRowCount={job?.processedRowCount || 0}
        onKeep={() => keepPartialDataAfterCancel(job, setSheet, setModalDialog)}
        onDiscard={() => discardPartialDataAfterCancel(setJob, setModalDialog)}
      />

      <ExportOptionsDialog 
        isOpen={modalDialog === ExportOptionsDialog.name} sheet={sheet}
        onExport={(sheetForExport, exportOptions) => exportSheet(sheetForExport, exportOptions, setModalDialog)}
        onCancel={() => setModalDialog(null)} 
      />

      <ToastPane/>
    </div>
  );
}

export default HomeScreen;