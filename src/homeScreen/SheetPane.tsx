import SheetView from "./SheetView";
import Pane, { ButtonDefinition } from "@/components/pane/Pane";
import { getComment } from "./interactions/comment";
import HoneSheet from "@/sheets/types/HoneSheet";

type Props = {
  sheet: HoneSheet|null,
  className:string,
  selectedRowNo:number,
  onRowSelect:(rowNo:number)=>void
  onExportSheet():void,
  onImportSheet():void
}

function _noSheetLoadedContent() {
  return <div>No sheet loaded.</div>;
}

function _sheetContent(sheet:HoneSheet|null, selectedRowNo:number, onRowSelect:(rowNo:number)=>void) {
  if (!sheet) return _noSheetLoadedContent();
  return <SheetView sheet={sheet} selectedRowNo={selectedRowNo} onRowSelect={onRowSelect}/>;
}

function SheetPane({sheet, className, onImportSheet, selectedRowNo, onRowSelect, onExportSheet}:Props) {
  const content = _sheetContent(sheet, selectedRowNo, onRowSelect);

  const buttons:ButtonDefinition[] = [
    { text:'Import', onClick:() => onImportSheet() }, 
    { text:'Export', onClick:() => onExportSheet(), disabled:sheet===null }, 
  ];

  const comment = getComment(sheet);
  const sheetCaption = sheet ? `Sheet - ${sheet.name}` : 'Sheet';
  return (
    <Pane caption={sheetCaption} className={className} buttons={buttons} comment={comment}>
      {content}
    </Pane>
  );
}

export default SheetPane;