import Pane, { ButtonDefinition } from "@/components/pane/Pane";
import { getComment } from "./interactions/comment";
import HoneSheet from "@/sheets/types/HoneSheet";
import SheetTable, { GeneratedFooterText, HorizontalScroll } from "@/components/sheetTable/SheetTable";

type Props = {
  sheet: HoneSheet|null,
  className:string,
  selectedRowNo:number,
  horizontalScroll:HorizontalScroll,
  onRowSelect:(rowNo:number)=>void
  onExportSheet():void,
  onImportSheet():void
}

function _noSheetLoadedContent() {
  return <div>No sheet loaded.</div>;
}

function _sheetContent(sheet:HoneSheet|null, selectedRowNo:number, _onRowSelect:(rowNo:number)=>void, horizontalScroll:HorizontalScroll) {
  if (!sheet) return _noSheetLoadedContent();
  const onSelectCell = (_colNo:number, rowNo:number) => _onRowSelect(rowNo);
  return <SheetTable 
    selectedRowNo={selectedRowNo} sheet={sheet} footerText={GeneratedFooterText.ROW_COUNT} 
    onSelectCell={onSelectCell} displayRowCount={20} horizontalScroll={horizontalScroll}/>;
}

function SheetPane({sheet, className, onImportSheet, selectedRowNo, onRowSelect, onExportSheet, horizontalScroll}:Props) {
  const content = _sheetContent(sheet, selectedRowNo, onRowSelect, horizontalScroll);

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