import { WorkBook } from "xlsx";
import { useEffect } from "react";

import SheetView from "./SheetView";
import { errorToast } from "@/components/toasts/toastUtil";
import Pane, { ButtonDefinition } from "@/components/pane/Pane";
import { importExample, importWorkbook } from "./interactions/import";
import { getComment } from "./interactions/comment";
import HoneSheet from "@/sheets/types/HoneSheet";

type Props = {
  sheet: HoneSheet|null,
  workbook: WorkBook|null,
  className:string,
  onChangeWorkbook(workbook:WorkBook, workbookName:string):void
}

function _noSheetLoadedContent() {
  return <div>No sheet loaded.</div>;
}

function _sheetContent(sheet:HoneSheet|null) {
  if (!sheet) return _noSheetLoadedContent();
  return <SheetView sheet={sheet} />;
}

function SheetPane({workbook, sheet, className, onChangeWorkbook}:Props) {
  useEffect(() => {
    if (!workbook) return;
    if (!workbook.SheetNames.length) errorToast('Workbook has no sheets.');
  }, [workbook]);

  const content = _sheetContent(sheet);

  const buttons:ButtonDefinition[] = [
    { text:'Import...', onClick:() => {importWorkbook(onChangeWorkbook)} }, 
    { text:"Example", onClick:() => {importExample(onChangeWorkbook)} }];

  const comment = getComment(sheet);
  const sheetCaption = sheet ? `Sheet - ${sheet.name}` : 'Sheet';
  return (
    <Pane caption={sheetCaption} className={className} buttons={buttons} comment={comment}>
      {content}
    </Pane>
  );
}

export default SheetPane;