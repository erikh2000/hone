import { CSSProperties } from 'react';

import DOMTextMeasurer from '@/components/sheetTable/DOMTextMeasurer';
import rowStyles from '@/components/sheetTable/SheetRow.module.css';
import { GeneratedFooterText } from '@/components/sheetTable/types/GeneratedFooterText';
import HorizontalScroll from '@/components/sheetTable/types/HorizontalScroll';
import VerticalScroll from '@/components/sheetTable/types/VerticalScroll';

export function measureColumnWidths(sheetTableElement:HTMLDivElement, columnNames:string[], rows:any[][]):number[] {
  const measurer = new DOMTextMeasurer(sheetTableElement, rowStyles.measureCellText);
  const widths = columnNames.map(columnName => measurer.measureTextWidth(columnName));
  for(let rowI = 0; rowI < rows.length; rowI++) {
    const row = rows[rowI];
    for(let cellI = 0; cellI < row.length; cellI++) {
      const cell = '' + row[cellI];
      widths[cellI] = Math.max(widths[cellI], measurer.measureTextWidth(cell));
    }
  }
  return widths;
}

export function getFooterText(footerText:string|GeneratedFooterText|undefined, rows:any[][]):string {
  if (footerText === undefined) return '';
  if (footerText === GeneratedFooterText.ROW_COUNT) return rows.length === 1 ? '1 row' : `${rows.length} rows`;
  return footerText;
}

export function syncScrollableElements(headerInnerElement:HTMLDivElement, rowsScrollElement:HTMLDivElement) {
  const scrollLeft = rowsScrollElement.scrollLeft;
  headerInnerElement.style.transform = `translateX(-${scrollLeft}px)`;
}

export function getRowScrollContainerStyle(displayRowCount:number|undefined, parentElement:HTMLDivElement|null):CSSProperties {
  if (!displayRowCount || !parentElement) return {};
  const measurer = new DOMTextMeasurer(parentElement, rowStyles.measureCellText);
  const lineHeight = measurer.getLineHeight();
  return {maxHeight:displayRowCount * lineHeight + 'px'};
}

export function setHorizontalScroll(rowsScrollElement:HTMLDivElement, horizontalScroll?:HorizontalScroll) {
  if (horizontalScroll === undefined || horizontalScroll === HorizontalScroll.CLEAR || rowsScrollElement === null) return;
  if (horizontalScroll === HorizontalScroll.LEFT) {
    rowsScrollElement.scrollLeft = 0;
  } else if (horizontalScroll === HorizontalScroll.RIGHT) {
    rowsScrollElement.scrollLeft = rowsScrollElement.scrollWidth;
  }
}

export function setVerticalScroll(rowsScrollElement:HTMLDivElement, verticalScroll?:VerticalScroll) {
  if (verticalScroll === undefined || verticalScroll === VerticalScroll.CLEAR || rowsScrollElement === null) return;
  if (verticalScroll === VerticalScroll.TOP) {
    rowsScrollElement.scrollTop = 0;
  } else if (verticalScroll === VerticalScroll.BOTTOM) {
    rowsScrollElement.scrollTop = rowsScrollElement.scrollHeight;
  }
}