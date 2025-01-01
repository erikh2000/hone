import { CSSProperties, RefObject } from 'react';
import HoneSheet from '@/sheets/types/HoneSheet';
import DOMTextMeasurer from '@/components/sheetTable/DOMTextMeasurer';
import { plural } from '@/common/englishGrammarUtil';
import rowStyles from '@/components/sheetTable/SheetRow.module.css';
import { GeneratedFooterText } from '@/components/sheetTable/types/GeneratedFooterText';
import HorizontalScroll from '@/components/sheetTable/types/HorizontalScroll';
import VerticalScroll from '@/components/sheetTable/types/VerticalScroll';

type DivRef = RefObject<HTMLDivElement>;

export function measureColumnWidths(sheetTableElement:HTMLDivElement, sheet:HoneSheet):number[] {
  const measurer = new DOMTextMeasurer(sheetTableElement, rowStyles.measureCellText);
  const widths = sheet.columns.map(column => measurer.measureTextWidth(column.name));
  for(let rowI = 0; rowI < sheet.rows.length; rowI++) {
    const row = sheet.rows[rowI];
    for(let cellI = 0; cellI < row.length; cellI++) {
      const cell = '' + row[cellI];
      widths[cellI] = Math.max(widths[cellI], measurer.measureTextWidth(cell));
    }
  }
  return widths;
}

export function getFooterText(footerText:string|GeneratedFooterText|undefined, sheet:HoneSheet):string {
  if (footerText === undefined) return '';
  if (footerText === GeneratedFooterText.ROW_COUNT) return `${sheet.rows.length} ${plural('row', sheet.rows.length)}`;
  return footerText;
}

export function syncScrollableElements(headerInnerElement:DivRef, rowsScrollElement:DivRef) {
  if (!headerInnerElement.current || !rowsScrollElement.current) return;
  const scrollLeft = rowsScrollElement.current.scrollLeft;
  headerInnerElement.current.style.transform = `translateX(-${scrollLeft}px)`;
}

export function getRowScrollContainerStyle(displayRowCount:number|undefined, parentElement:HTMLDivElement|null):CSSProperties {
  if (!displayRowCount || !parentElement) return {};
  const measurer = new DOMTextMeasurer(parentElement, rowStyles.measureCellText);
  const lineHeight = measurer.getLineHeight();
  return {maxHeight:displayRowCount * lineHeight + 'px'};
}

export function setHorizontalScroll(rowsScrollElement:DivRef, horizontalScroll?:HorizontalScroll) {
  if (horizontalScroll === undefined || horizontalScroll === HorizontalScroll.CLEAR || rowsScrollElement.current === null) return;
  if (horizontalScroll === HorizontalScroll.LEFT) {
    rowsScrollElement.current.scrollLeft = 0;
  } else if (horizontalScroll === HorizontalScroll.RIGHT) {
    rowsScrollElement.current.scrollLeft = rowsScrollElement.current.scrollWidth;
  }
}

export function setVerticalScroll(rowsScrollElement:DivRef, verticalScroll?:VerticalScroll) {
  if (verticalScroll === undefined || verticalScroll === VerticalScroll.CLEAR || rowsScrollElement.current === null) return;
  if (verticalScroll === VerticalScroll.TOP) {
    rowsScrollElement.current.scrollTop = 0;
  } else if (verticalScroll === VerticalScroll.BOTTOM) {
    rowsScrollElement.current.scrollTop = rowsScrollElement.current.scrollHeight;
  }
}