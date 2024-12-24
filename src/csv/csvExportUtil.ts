import { encodeUtf8 } from "@/common/stringUtil";

export const TAB = '\t';
export const COMMA = ',';
const DEFAULT_FIELD_DELIMITER = TAB;
const ROW_DELIMITER = '\r\n';

/*
   Here's the best practices for writing CSV so it's likely to be compatible with a variety of apps.
   
   1. File Encoding: Use UTF-8 to support international characters.
   2. Column Delimiter: Use tabs as the standard delimiter. (Google Sheets uses tabs and not commas for clipboard. Numbers works with tabs. TODO test with Excel)
   3. Text Qualifier: Enclose text fields with quotes (") when necessary.
   4. Line Breaks: Use CRLF (\r\n) for maximum compatibility.
   
   -5. Header Row: Include a header row with column names in snake_case or camelCase.-

   I intentionally decided against this in the interest of supporting any column name. including 
   those with spaces, special characters, non-latin alphabets, etc. My understanding is that popular,
   modern spreadsheet software will handle this fine. Can revisit if it becomes a problem.

   6. Consistent Field Count: Ensure all rows have the same number of fields.
   7. No Excess Whitespace: Avoid trailing or leading whitespace around values.
   8. Clean Numeric Fields: Avoid formatting numbers with commas or symbols
   9. Date/time Format: Use ISO 8601 format for dates and times. Include timezones.
   10. Null Values: Represent null values as an empty string.
   11. Boolean Values: Represent boolean values as "true" or "false".
*/

function _doesCellTextNeedQuoting(text:string, fieldDelimiter:string):boolean {
  return text.includes('"') || text.includes(fieldDelimiter) || text.includes('\n') || text.includes('\r');
}

function _textCellValue(text:string, fieldDelimiter:string):string {
  if (!_doesCellTextNeedQuoting(text, fieldDelimiter)) return text;
  if (text.includes('"')) text = text.replace(/"/g, '""'); // quotes escaped to two quotes.
  return `"${text}"`;
}

function _concatHeaderRow(fieldNames:string[], fieldDelimiter:string):string {
  fieldNames = fieldNames.map(fieldName => _textCellValue(fieldName.trim(), fieldDelimiter));
  return fieldNames.join(fieldDelimiter) + ROW_DELIMITER;
}

function _cellValue(value:any, fieldDelimiter:string):string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return _textCellValue(value, fieldDelimiter);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return value.toString();
}

function _doAnyRowsHaveDifferentFieldCount(rowArray:any[][], fieldCount:number):boolean {
  return rowArray.some(row => row.length !== fieldCount);
}

export function rowArrayToCsvUnicode(rowArray:any[][], fieldNames:string[], addHeaders:boolean, fieldDelimiter:string = DEFAULT_FIELD_DELIMITER):string {
  let csv:string = addHeaders ? _concatHeaderRow(fieldNames, fieldDelimiter) : '';
  if (fieldNames.length === 0) throw new Error('fieldNames must have at least one element.');
  if (_doAnyRowsHaveDifferentFieldCount(rowArray, fieldNames.length)) throw new Error('All rows must have the same number of fields as fieldNames.');
  rowArray.forEach(row => {
    csv += fieldNames
      .map((_, fieldI) => _cellValue(row[fieldI], fieldDelimiter) )
      .join(fieldDelimiter) 
      + ROW_DELIMITER;
  });
  return csv;
}

export function rowArrayToCsvUtf8(rowArray:any[][], fieldNames:string[], addHeaders:boolean, fieldDelimiter:string = DEFAULT_FIELD_DELIMITER):Uint8Array {
  let csvUnicode:string = rowArrayToCsvUnicode(rowArray, fieldNames, addHeaders, fieldDelimiter);
  return encodeUtf8(csvUnicode);
}