import { WorkBook, utils, read, write } from 'xlsx';

import StringMap from '@/common/types/StringMap';
import HoneSheet from './types/HoneSheet';
import HoneColumn from './types/HoneColumn';
import { rowArrayToCsvUtf8  } from '@/csv/csvExportUtil';
import { csvUnicodeToRowArray, csvUtf8ToRowArray, MAX_FIELDNAME_LENGTH } from '@/csv/csvImportUtil';
import AppException from '@/common/types/AppException';
import Rowset from './types/Rowset';
import { generateColumnNames } from './columnUtil';

export enum SheetErrorType {
  CLIPBOARD_NO_ROWS = 'SheetErrorType-CLIPBOARD_NO_ROWS',
  NO_CLIPBOARD_ACCESS = 'SheetErrorType-NO_CLIPBOARD_ACCESS',
  UNEXPECTED_CLIPBOARD_ERROR = 'SheetErrorType-UNEXPECTED_CLIPBOARD_ERROR',
  READ_FILE_ERROR = 'SheetErrorType-READ_FILE_ERROR',
  XLS_FORMAT_ERROR = 'SheetErrorType-XLS_FORMAT_ERROR',
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

// Returns the count of fields in the row with the most fields or -1 if all rows have same field count
function _findLongestFieldCount(rows:Rowset):number {
  let longestFieldCount = rows[0].length, foundMismatch = false;
  for (let i = 1; i < rows.length; i++) {
    foundMismatch ||= rows[i].length !== longestFieldCount;
    if (rows[i].length > longestFieldCount) longestFieldCount = rows[i].length;
  }
  return longestFieldCount;
}

function _fixMismatchedFieldCounts(rows:Rowset) {
  let longestFieldCount = _findLongestFieldCount(rows);
  if (longestFieldCount === -1) return; // All rows have the same field count.

  // Pad header as needed.
  const headerAddFieldCount = longestFieldCount - rows[0].length;
  if (headerAddFieldCount) {
    const columnsToAdd = generateColumnNames(headerAddFieldCount);
    rows[0] = rows[0].concat(columnsToAdd);
  }

  // Pad each row with NULL-value cells to have the same number of fields as the longest row.
  for (let i = 1; i < rows.length; i++) {
    const addFieldCount = longestFieldCount - rows[i].length;
    if (addFieldCount) rows[i] = rows[i].concat(new Array(addFieldCount).fill(null));
  }
}

function _createColumns(rows:Rowset):HoneColumn[] {
  if (!rows.length) throw Error('Unexpected');
  const headerRow = [...rows[0]];
  const uniqueColumnNames = new Set<string>();
  headerRow.forEach((columnValue, columnI) => {
    let columnName = '' + columnValue;
    if (uniqueColumnNames.has(columnName)) {
      let i = 1;
      while (uniqueColumnNames.has(columnName + i)) ++i;
      columnName += i;
    }
    uniqueColumnNames.add(columnName);
    headerRow[columnI] = columnName
  });
  return headerRow.map(name => ({ name, isWritable:false }));
}

function _createSheetset(workbook:WorkBook, onSkipSheetError:(message:string) => void):HoneSheet[] {
  const sheets:HoneSheet[] = [];
  workbook.SheetNames.forEach(sheetName => {
    try {
      const sheet = createHoneSheet(workbook, sheetName);
      sheets.push(sheet);
    } catch(e:any) {
      const message = `"${sheetName}" sheet is not importable: ${e.message}`;
      onSkipSheetError(message);
    }
  });
  return sheets;
}

// Can throw SheetErrorType.XLS_NOT_ENOUGH_ROWS
export function createHoneSheet(workbook:WorkBook, sheetName:string):HoneSheet {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw Error('Unexpected');
  const ref = sheet['!ref'];
  if (!ref) throw new AppException(SheetErrorType.XLS_NOT_ENOUGH_ROWS, 'Sheet needs at least two rows - one for headers and one for data.');

  const rowsWithHeader = utils.sheet_to_json(sheet, {header:1}) as Rowset;
  if (rowsWithHeader.length < 2) throw new AppException(SheetErrorType.XLS_NOT_ENOUGH_ROWS, 'Sheet needs at least two rows - one for headers and one for data.');
  _fixMismatchedFieldCounts(rowsWithHeader);
  const columns:HoneColumn[] = _createColumns(rowsWithHeader);
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

export function cellValueToText(cellValue:any):string {
  if (cellValue === null || cellValue === undefined) return '';
  if (typeof cellValue === 'string') return cellValue;
  if (typeof cellValue === 'number') return '' + cellValue;
  if (typeof cellValue === 'boolean') return cellValue ? 'true' : 'false';
  if (cellValue instanceof Date) return cellValue.toISOString();
  return '' + cellValue;
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

async function _readDataTransferText(dataTransfer:DataTransfer):Promise<string> {
  try {
    const text = await dataTransfer.getData('text/plain');
    return text;
  } catch(e:any) {
    throw new AppException(SheetErrorType.UNEXPECTED_CLIPBOARD_ERROR, e.message);
  }
}

function _fileNameToSheetName(filename:string):string {
  let dotI = filename.lastIndexOf('.');
  return dotI === -1 ? filename : filename.substring(0, dotI);
}

function _rowToColumns(firstRow:string[]):HoneColumn[] {
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

// Can throw SheetErrorType.XLS_FORMAT_ERROR, SheetErrorType.READ_FILE_ERROR Additional 
// per-sheet errors that exclude sheets will be passed to onImportErrorMessage.
export async function importSheetsFromXlsBytes(data:Uint8Array, onSkipSheetError:(message:string) => void):Promise<HoneSheet[]> {
  let workbook:WorkBook;
  try {
    workbook = read(data, {type: 'array'});
  } catch(e:any) {
    throw new AppException(SheetErrorType.XLS_FORMAT_ERROR, e.message);
  }
  if (!workbook.SheetNames.length) return [];
  return _createSheetset(workbook, onSkipSheetError);
}

// Can throw SheetErrorType.XLS_FORMAT_ERROR, SheetErrorType.READ_FILE_ERROR. Additional 
// per-sheet errors that exclude sheets will be passed to onImportErrorMessage.
export async function importSheetsFromXlsFile(fileHandle:FileSystemFileHandle, onSkipSheetError:(message:string) => void):Promise<HoneSheet[]> {
  const data = await readFileAsUint8Array(fileHandle);
  return importSheetsFromXlsBytes(data, onSkipSheetError);
}

// Can throw CvsImportError.NO_DATA, FIELD_COUNT_MISMATCH, UNSTRUCTURED_DATA, TOO_MANY_FIELDS, 
//           SheetError.READ_FILE_ERROR
export async function importSheetFromCsvFile(fileHandle:FileSystemFileHandle, useFirstRowColumnNames:boolean):Promise<HoneSheet> {
  const csvUtf8 = await readFileAsUint8Array(fileHandle);
  const sheetName = _fileNameToSheetName(fileHandle.name);
  let rows = csvUtf8ToRowArray(csvUtf8, useFirstRowColumnNames);
  const columns = _rowToColumns(rows[0]);
  rows = rows.slice(1);
  return { name:sheetName, columns, rows };
}

// Can throw CvsImportError.NO_DATA, FIELD_COUNT_MISMATCH, UNSTRUCTURED_DATA, TOO_MANY_FIELDS, 
//           SheetError.CLIPBOARD_NO_ROWS, NO_CLIPBOARD_ACCESS, UNEXPECTED_CLIPBOARD_ERROR
export async function importSheetFromClipboard(useFirstRowColumnNames:boolean, sheetName:string):Promise<HoneSheet> {
  const text = await _readClipboardText();
  let rows = csvUnicodeToRowArray(text, useFirstRowColumnNames);
  const columns = _rowToColumns(rows[0]);
  rows = rows.slice(1);
  if (!rows.length) throw new AppException(SheetErrorType.CLIPBOARD_NO_ROWS, 'No rows found in clipboard data.');
  return { name:sheetName, columns, rows };
}

function _doesRowLookLikeColumnNames(row:string[]):boolean {
  if (!row.length) return false;
  return !row.some(
      fieldValue => typeof fieldValue !== 'string' 
      || fieldValue.length > MAX_FIELDNAME_LENGTH 
      || fieldValue === ''
    );
}

export async function importSheetFromClipboardData(clipboardData:DataTransfer, sheetName:string):Promise<HoneSheet> {
  const text = await _readDataTransferText(clipboardData);
  let rows = csvUnicodeToRowArray(text, false);
  if (rows.length === 1) throw new AppException(SheetErrorType.CLIPBOARD_NO_ROWS, 'No rows found in clipboard data.');
  const headerRowI = (_doesRowLookLikeColumnNames(rows[1])) ? 1 : 0;
  if (rows.length === 2 && headerRowI === 1) throw new AppException(SheetErrorType.CLIPBOARD_NO_ROWS, 'No data rows found in clipboard data.');
  const columns = _rowToColumns(rows[headerRowI]);
  rows = rows.slice(headerRowI + 1);
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