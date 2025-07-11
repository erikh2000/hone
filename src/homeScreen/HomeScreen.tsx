import { useEffect, useState } from "react";
import { ModelDeviceProblem, ModelDeviceProblemsDialog } from "decent-portal";
import { useLocation } from "wouter";

import styles from './HomeScreen.module.css';
import { deinit, init } from "./interactions/initialization";
import ToastPane from "@/components/toasts/ToastPane";
import SheetPane from "./SheetPane";
import ImportSheetDialog from "./dialogs/ImportSheetDialog";
import { importSheet, onSelectSheet } from "./interactions/import";
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
import AboutDialog from "./dialogs/AboutDialog";
import ExecuteDialog from "./dialogs/ExecuteDialog";
import { chooseExportType, exportSheet } from "./interactions/export";
import KeepPartialDataDialog from "./dialogs/KeepPartialDataDialog";
import ResumeJobDialog from "./dialogs/ResumeJobDialog";
import ExportOptionsDialog from "./dialogs/ExportOptionsDialog";
import ImportOptionsDialog from "./dialogs/ImportOptionsDialog";
import ConfirmSheetPasteDialog from "./dialogs/ConfirmSheetPasteDialog";
import ImportExampleDialog from "./dialogs/ImportExampleDialog";
import { LOAD_URL } from "@/init/theUrls";
import { doesSheetHaveWritableColumns } from "@/sheets/sheetUtil";
import HorizontalScroll from "@/components/sheetTable/types/HorizontalScroll";
import ConfirmClearSheetDialog from "./dialogs/ConfirmClearSheetDialog";
import TopBar from "@/components/topBar/TopBar";
import { WEBLLM_MODEL } from "@/llm/webLlmUtil";

function HomeScreen() {
  const [sheet, setSheet] = useState<HoneSheet|null>(null);
  const [availableSheets, setAvailableSheets] = useState<HoneSheet[]>([]);
  const [selectedRowNo, setSelectedRowNo] = useState<number>(1);
  const [job, setJob] = useState<ExecutionJob|null>(null);
  const [modalDialog, setModalDialog] = useState<string|null>(null);
  const [promptTemplate, setPromptTemplate] = useState<string>('');
  const [sheetHorizontalScroll, setSheetHorizontalScroll] = useState<HorizontalScroll>(HorizontalScroll.CLEAR);
  const [modelDeviceProblems, setModelDeviceProblems] = useState<ModelDeviceProblem[]>([]);
  const [, setLocation] = useLocation();

  useEffect(() => {
    init(setAvailableSheets, setModalDialog, setLocation, setModelDeviceProblems).then(() => { });
    return deinit;
  }, []);

  useEffect(() => {
    if (!sheet) return;
    if (doesSheetHaveWritableColumns(sheet)) {
      setSheetHorizontalScroll(HorizontalScroll.RIGHT); // To show newly added column.
      return;
    }
    setSheetHorizontalScroll(HorizontalScroll.LEFT);
  }, [sheet]);

  useEffect(() => {
    if (sheetHorizontalScroll === HorizontalScroll.CLEAR) return;
    setSheetHorizontalScroll(HorizontalScroll.CLEAR); // Reset so it can be set again later.
  }, [sheetHorizontalScroll]);

  const promptPaneContent = !sheet ? null : 
    <PromptPane 
      sheet={sheet} className={styles.promptPane} 
      testRowNo={selectedRowNo}
      defaultPromptTemplate={promptTemplate} 
      onExecute={promptTemplate => setUpExecution(job, sheet, promptTemplate, setPromptTemplate, setJob, setModalDialog)}
    />;
  
  return (
    <div className={styles.container}>
      <TopBar onAboutClick={() => setModalDialog(AboutDialog.name)} />
      <SheetPane 
        sheet={sheet} className={styles.sheetPane} selectedRowNo={selectedRowNo} 
        horizontalScroll={sheetHorizontalScroll}
        onRowSelect={setSelectedRowNo}
        onClearSheet={() => setModalDialog(ConfirmClearSheetDialog.name)}
        onImportSheet={() => setModalDialog(ImportOptionsDialog.name)}
        onExportSheet={() => chooseExportType(setModalDialog)}
      />
      {promptPaneContent}

      <ModelDeviceProblemsDialog 
        modelId={WEBLLM_MODEL} isOpen={modalDialog === ModelDeviceProblemsDialog.name} problems={modelDeviceProblems} 
        onCancel={() => setModalDialog(null)} onConfirm={() => setLocation(LOAD_URL)} />

      <ImportSheetDialog availableSheets={availableSheets} isOpen={modalDialog === ImportSheetDialog.name} 
        onChoose={(nextSheet, nextPromptTemplate) => onSelectSheet(nextSheet, nextPromptTemplate, setAvailableSheets, setSheet, setPromptTemplate, setModalDialog)} 
        onCancel={() => setModalDialog(null)} 
      />

      <ImportExampleDialog availableSheets={availableSheets} isOpen={modalDialog === ImportExampleDialog.name} 
        onChoose={(nextSheet, nextPromptTemplate) => onSelectSheet(nextSheet, nextPromptTemplate, setAvailableSheets, setSheet, setPromptTemplate, setModalDialog)} 
        onCancel={() => setModalDialog(null)} 
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

      <ImportOptionsDialog 
        isOpen={modalDialog === ImportOptionsDialog.name} sheet={sheet}
        onImport={(importOptions) => importSheet(importOptions, setAvailableSheets, setSheet, setModalDialog)}
        onCancel={() => setModalDialog(null)}
      />

      <ConfirmSheetPasteDialog
        isOpen={modalDialog === ConfirmSheetPasteDialog.name}
        pastedSheet={availableSheets[0]}
        existingSheet={sheet}
        onConfirm={(pastedSheet) => onSelectSheet(pastedSheet, '', setAvailableSheets, setSheet, setPromptTemplate, setModalDialog)}
        onCancel={() => setModalDialog(null)}
      />

      <ConfirmClearSheetDialog
        isOpen={modalDialog === ConfirmClearSheetDialog.name}
        sheet={sheet}
        onConfirm={() => setSheet(null)}
        onCancel={() => setModalDialog(null)}
      />

      <AboutDialog isOpen={modalDialog === AboutDialog.name} onClose={() => setModalDialog(null)} />

      <ToastPane/>
    </div>
  );
}

export default HomeScreen;