import { WorkBook, utils, write } from 'xlsx';

import StringMap from '@/common/types/StringMap';
import HoneSheet from './types/HoneSheet';
import HoneColumn from './types/HoneColumn';
import { rowArrayToCsvUtf8  } from '@/common/csvUtil';

export function createRowNameValues(sheet:HoneSheet, rowNo:number):StringMap {
  const rowI = rowNo - 1;
  const rowNameValues:StringMap = {};
  sheet.columns.forEach((column, columnI) => {
    rowNameValues[column.name] = sheet.rows[rowI][columnI];
  });
  return rowNameValues;
}

export function createHoneSheet(workbook:WorkBook, sheetName:string):HoneSheet {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw Error('Unexpected');
  const ref = sheet['!ref'];
  if (!ref) return { name:sheetName, columns:[], rows:[] };

  const rowsWithHeader = utils.sheet_to_json(sheet, {header:1});
  const columnNames = rowsWithHeader[0] as string[];
  const columns:HoneColumn[] = columnNames.map((name) => ({ name, cells:[], isWritable:false }));
  
  const rows = rowsWithHeader.slice(1) as any[][];

  return { name:sheetName, columns, rows };
}

export function duplicateSheet(sheet:HoneSheet):HoneSheet {
  const columns = sheet.columns.map(column => ({ ...column }));
  const rows = sheet.rows.map(row => row.slice());
  return { name:sheet.name, columns, rows };
}

export const HTML_NBSP = '\u00A0'; // Same as "&nbsp;" - useful for padding in tables to keep rows from disappearing.
export function getSheetRows(sheet:HoneSheet, startRow:number = 0, maxRows:number = 0, padToMax:boolean = false, paddingValue = HTML_NBSP):any[][] {
  let rows = sheet.rows.slice(startRow);
  if (maxRows) rows = rows.slice(0, maxRows);
  if (rows.length < maxRows && padToMax) {
    const emptyRow = new Array(sheet.columns.length).fill(paddingValue);
    const padRows = new Array(maxRows - rows.length).fill(emptyRow);
    rows = rows.concat(padRows);
  }
  return rows;
}

export function addNewColumn(sheet:HoneSheet, columnName:string) {
  sheet.columns.push({ name:columnName, isWritable:true });
  sheet.rows.forEach(row => row.push(''));
}

export function getColumnNames(sheet:HoneSheet) { return sheet.columns.map(column => column.name); }

export function getColumnNos(sheet:HoneSheet) { return sheet.columns.map((_, i) => i); }

export function getWritableColumnNames(sheet:HoneSheet) {
  return sheet.columns.filter(column => column.isWritable).map(column => column.name);
}

export function doesSheetHaveWritableColumns(sheet:HoneSheet):boolean {
  return sheet.columns.some(column => column.isWritable);
}

export async function exportSheetToClipboard(sheet:HoneSheet, includeHeaders:boolean) {
  const fieldNames = getColumnNames(sheet);
  const rows = sheet.rows;
  const csvBytes = rowArrayToCsvUtf8(rows, fieldNames, includeHeaders);
  const plainTextBlob = new Blob([csvBytes], {type:'text/plain'});
  const clipboardItem = new ClipboardItem({'text/plain':plainTextBlob}); // I wanted to send also 'text/cvs', but Chrome and probably other browsers throw an error.    
  await navigator.clipboard.write([clipboardItem]);
}

export async function exportSheetToCsvFile(sheet:HoneSheet, fileHandle:FileSystemFileHandle) {
  const fieldNames = getColumnNames(sheet);
  const rows = sheet.rows;
  const csvBytes = rowArrayToCsvUtf8(rows, fieldNames, true);

  const writable = await fileHandle.createWritable();
  await writable.write(csvBytes);
  await writable.close();
}

export async function exportSheetToXlsxFile(sheet:HoneSheet, fileHandle:FileSystemFileHandle) {
  const workbook = utils.book_new();
  const worksheet = utils.aoa_to_sheet([getColumnNames(sheet)].concat(sheet.rows));
  utils.book_append_sheet(workbook, worksheet, sheet.name);
  const xlsxBytes = write(workbook, {type:'array', bookType:'xlsx'});
  
  const writable = await fileHandle.createWritable();
  await writable.write(new Uint8Array(xlsxBytes));
  await writable.close();
}

export function removeExcludedColumns(sheet:HoneSheet, includeColumnNos:number[]) {
  const columns = sheet.columns.filter((_, i) => includeColumnNos.includes(i));
  const rows = sheet.rows.map(row => row.filter((_, i) => includeColumnNos.includes(i)));
  return { name:sheet.name, columns, rows };
}