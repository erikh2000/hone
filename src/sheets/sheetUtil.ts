import { WorkBook, utils, read, write } from 'xlsx';

import StringMap from '@/common/types/StringMap';
import HoneSheet from './types/HoneSheet';
import HoneColumn from './types/HoneColumn';
import { rowArrayToCsvUtf8  } from '@/csv/csvExportUtil';
import { csvUnicodeToRowArray, csvUtf8ToRowArray } from '@/csv/csvImportUtil';
import AppException from '@/common/types/AppException';
import Rowset from './types/Rowset';

export enum SheetErrorType {
  CLIPBOARD_NO_ROWS = 'SheetErrorType-CLIPBOARD_NO_ROWS',
  NO_CLIPBOARD_ACCESS = 'SheetErrorType-NO_CLIPBOARD_ACCESS',
  UNEXPECTED_CLIPBOARD_ERROR = 'SheetErrorType-UNEXPECTED_CLIPBOARD_ERROR',
  READ_FILE_ERROR = 'SheetErrorType-READ_FILE_ERROR',
  XLS_FORMAT_ERROR = 'SheetErrorType-XLS_FORMAT_ERROR',
  XLS_FIELD_COUNT_MISMATCH = 'SheetErrorType-FIELD_COUNT_MISMATCH',
  XLS_NOT_ENOUGH_ROWS = 'SheetErrorType-NO_DATA'
}

export function createRowNameValues(sheet:HoneSheet, rowNo:number):StringMap {
  const rowI = rowNo - 1;
  const rowNameValues:StringMap = {};
  sheet.columns.forEach((column, columnI) => {
    rowNameValues[column.name] = sheet.rows[rowI][columnI];
  });
  return rowNameValues;
}

export function _findRowWithMismatchedFieldCount(rows:Rowset):number {
  const fieldCount = rows[0].length;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].length !== fieldCount) return i + 1;
  }
  return -1;
}

function _createSheetset(workbook:WorkBook):HoneSheet[] {
  const sheets:HoneSheet[] = [];
  workbook.SheetNames.forEach(sheetName => {
    try {
      const sheet = createHoneSheet(workbook, sheetName);
      sheets.push(sheet);
    } catch(_ignored) {}
  });
  return sheets;
}

// Can throw SheetErrorType.XLS_NOT_ENOUGH_ROWS, SheetErrorType.XLS_FIELD_COUNT_MISMATCH
export function createHoneSheet(workbook:WorkBook, sheetName:string):HoneSheet {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw Error('Unexpected');
  const ref = sheet['!ref'];
  if (!ref) return { name:sheetName, columns:[], rows:[] };

  const rowsWithHeader = utils.sheet_to_json(sheet, {header:1}) as Rowset;
  if (rowsWithHeader.length < 2) throw new AppException(SheetErrorType.XLS_NOT_ENOUGH_ROWS, 'Sheet needs at least two rows - one for headers and one for data.');
  const mismatchRowNo = _findRowWithMismatchedFieldCount(rowsWithHeader);;
  if (mismatchRowNo !== -1) throw new AppException(SheetErrorType.XLS_FIELD_COUNT_MISMATCH, `Row ${mismatchRowNo} has a different number of fields than the header row.`);
  const columnNames = rowsWithHeader[0] as string[];
  const columns:HoneColumn[] = columnNames.map((cellValue) => ({ name:'' + cellValue, isWritable:false }));
  
  const rows = rowsWithHeader.slice(1) as Rowset;

  return { name:sheetName, columns, rows };
}

export function duplicateSheet(sheet:HoneSheet):HoneSheet {
  const columns = sheet.columns.map(column => ({ ...column }));
  const rows = sheet.rows.map(row => row.slice());
  return { name:sheet.name, columns, rows };
}

export const HTML_NBSP = '\u00A0'; // Same as "&nbsp;" - useful for padding in tables to keep rows from disappearing.
export function getSheetRows(sheet:HoneSheet, startRow:number = 0, maxRows:number = 0, padToMax:boolean = false, paddingValue = HTML_NBSP):Rowset {
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

async function _readClipboardText():Promise<string> {
  try {
    const text = await navigator.clipboard.readText();
    return text;
  } catch(e:any) {
    if (e.name === 'NotAllowedError') throw new AppException(SheetErrorType.NO_CLIPBOARD_ACCESS);
    throw new AppException(SheetErrorType.UNEXPECTED_CLIPBOARD_ERROR, e.message);
  }
}

function _fileNameToSheetName(filename:string):string {
  let dotI = filename.lastIndexOf('.');
  return dotI === -1 ? filename : filename.substring(0, dotI);
}

function _firstRowToColumns(firstRow:string[]):HoneColumn[] {
  return firstRow.map(name => ({ name, isWritable:false }));
}

export async function readFileAsUint8Array(fileHandle:FileSystemFileHandle):Promise<Uint8Array> {
  try {
    const file = await fileHandle.getFile();
    const blob = await file.arrayBuffer();
    return new Uint8Array(blob);
  } catch(e:any) {
    console.error(e);
    throw new AppException(SheetErrorType.READ_FILE_ERROR, e.message);
  }
}

// Can throw SheetErrorType.XLS_FORMAT_ERROR, SheetErrorType.READ_FILE_ERROR
export async function importSheetsFromXlsBytes(data:Uint8Array):Promise<HoneSheet[]> {
  let workbook:WorkBook;
  try {
    workbook = read(data, {type: 'array'});
  } catch(e:any) {
    throw new AppException(SheetErrorType.XLS_FORMAT_ERROR, e.message);
  }
  if (!workbook.SheetNames.length) return [];
  return _createSheetset(workbook);
}

// Can throw SheetErrorType.XLS_FORMAT_ERROR, SheetErrorType.READ_FILE_ERROR
export async function importSheetsFromXlsFile(fileHandle:FileSystemFileHandle):Promise<HoneSheet[]> {
  const data = await readFileAsUint8Array(fileHandle);
  return importSheetsFromXlsBytes(data);
}

// Can throw CvsImportError.NO_DATA, FIELD_COUNT_MISMATCH, UNSTRUCTURED_DATA, TOO_MANY_FIELDS, 
//           SheetError.READ_FILE_ERROR
export async function importSheetFromCsvFile(fileHandle:FileSystemFileHandle, useFirstRowColumnNames:boolean):Promise<HoneSheet> {
  const csvUtf8 = await readFileAsUint8Array(fileHandle);
  const sheetName = _fileNameToSheetName(fileHandle.name);
  let rows = csvUtf8ToRowArray(csvUtf8, useFirstRowColumnNames);
  const columns = _firstRowToColumns(rows[0]);
  rows = rows.slice(1);
  return { name:sheetName, columns, rows };
}

// Can throw CvsImportError.NO_DATA, FIELD_COUNT_MISMATCH, UNSTRUCTURED_DATA, TOO_MANY_FIELDS, 
//           SheetError.CLIPBOARD_NO_ROWS, NO_CLIPBOARD_ACCESS, UNEXPECTED_CLIPBOARD_ERROR
export async function importSheetFromClipboard(useFirstRowColumnNames:boolean, sheetName:string):Promise<HoneSheet> {
  const text = await _readClipboardText();
  let rows = csvUnicodeToRowArray(text, useFirstRowColumnNames);
  const columns = _firstRowToColumns(rows[0]);
  rows = rows.slice(1);
  if (!rows.length) throw new AppException(SheetErrorType.CLIPBOARD_NO_ROWS, 'No rows found in clipboard data.');
  return { name:sheetName, columns, rows };
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