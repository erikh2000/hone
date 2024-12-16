import { WorkBook, utils } from 'xlsx';

import StringMap from '../common/types/StringMap';
import HoneSheet from './types/HoneSheet';
import HoneColumn from './types/HoneColumn';

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

export function getWritableColumnNames(sheet:HoneSheet) {
  return sheet.columns.filter(column => column.isWritable).map(column => column.name);
}

export function doesSheetHaveWritableColumns(sheet:HoneSheet):boolean {
  return sheet.columns.some(column => column.isWritable);
}