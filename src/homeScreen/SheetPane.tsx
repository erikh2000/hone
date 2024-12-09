import { WorkBook } from "xlsx";
import { useEffect } from "react";

import SheetView from "./SheetView";
import { errorToast } from "@/components/toasts/toastUtil";
import Pane, { ButtonDefinition } from "@/components/pane/Pane";
import { importExample, importWorkbook } from "./interactions/import";

type Props = {
  sheetName: string,
  workbook: WorkBook|null,
  className:string,
  onChangeWorkbook(workbook:WorkBook, workbookName:string):void
}

function _noSheetLoadedContent() {
  return <div>No sheet loaded.</div>;
}

function _sheetContent(workbook:WorkBook|null, sheetName:string) {
  if (!workbook || sheetName === '') return _noSheetLoadedContent();
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return _noSheetLoadedContent();;

  return <SheetView sheetName={sheetName} sheet={sheet} />;
}

function SheetPane({workbook, sheetName, className, onChangeWorkbook}:Props) {
  useEffect(() => {
    if (!workbook) return;
    if (!workbook.SheetNames.length) errorToast('Workbook has no sheets.');
  }, [workbook]);

  const content = _sheetContent(workbook, sheetName);

  const buttons:ButtonDefinition[] = [
    { text:'Import...', onClick:() => {importWorkbook(onChangeWorkbook)} }, 
    { text:"Example", onClick:() => {importExample(onChangeWorkbook)} }];

  const sheetCaption = workbook ? `Sheet - ${sheetName}`  : 'Sheet';
  return (
    <Pane caption={sheetCaption} className={className} buttons={buttons}>
      {content}
    </Pane>
  );
}

export default SheetPane;