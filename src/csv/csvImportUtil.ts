import { decodeUtf8 } from "@/common/stringUtil";
import AppException from "@/common/types/AppException";
import { generateColumnNames } from "@/sheets/columnUtil";
import Row from "@/sheets/types/Row";
import Rowset from "@/sheets/types/Rowset";

export enum CvsImportErrorType {
  NO_DATA = 'CvsImportError-NO_DATA',              
  FIELD_COUNT_MISMATCH = 'CvsImportError-FIELD_COUNT_MISMATCH',
  UNSTRUCTURED_DATA = 'CvsImportError-UNSTRUCTURED_DATA',
  TOO_MANY_FIELDS = 'CvsImportError-TOO_MANY_FIELDS'
}

const COMMA = ',';
const TAB = '\t';
export const MAX_FIELD_COUNT = 256; // Well beyond anything reasonable.
export const MAX_FIELDNAME_LENGTH = 255; // Well beyond anything reasonable.

// fromPos must begin from a position known to be outside of quotes.
function _findOpenQuote(text:string, fromPos:number) {
  return text.indexOf('"', fromPos);
}

// fromPos must begin from a position known to be inside of quotes.
function _findCloseQuote(text:string, fromPos:number = 0) {
  let pos = fromPos;
  while(pos < text.length) {
    pos = text.indexOf('"', pos);
    if (pos === -1) return -1;
    let afterQuotePos = pos + 1;

    // Keep in mind that any number of consecutive quotes could be present. So...
    // " means a close quote was found, 
    // "" means an escaped quote was found, 
    // """ means an escaped quote was found, followed by a close quote,
    // """" means two escaped quotes were found, etc. An odd number of quotes,
    // means the last quote is the close quote. Even means all the quotes found are escaped.
    while(text[afterQuotePos] === '"') ++afterQuotePos;
    if (((afterQuotePos - pos) % 2) === 1) return afterQuotePos - 1;
    pos = afterQuotePos + 1;
  }
  return -1;
}

function _countFieldsInLine(line:string, fieldDelimiter:string):number {
  if (!line.length) return 1;
  let fieldCount = 1, pos = 0;
  let nextOpenQuotePos = _findOpenQuote(line, pos);
  while(true) {
    let nextDelimiterPos = line.indexOf(fieldDelimiter, pos);
    if (nextDelimiterPos === -1) return fieldCount;
    if (nextOpenQuotePos !== -1 && nextDelimiterPos > nextOpenQuotePos) {
      const closeQuotePos = _findCloseQuote(line, nextOpenQuotePos+1);
      if (closeQuotePos === -1) return fieldCount;
      pos = closeQuotePos+1;
      nextOpenQuotePos = _findOpenQuote(line, pos);
      continue;
    }
    pos = nextDelimiterPos+1;
    ++fieldCount;
  }
}

type DelimiterCheckState = { delimiter:string, firstRowFieldCount:number, failed:boolean };

export const SUFFICIENT_UNEQUAL_CHECK = 10; // # of rows to check before declaring delimiter with higher field count the winner.
function _findFieldDelimiter(lines:string[]):string {
  /* istanbul ignore next */ // Unreachable without a debug error in caller.
  if (!lines.length) throw Error('Unexpected'); // Check for this case before calling.
    
  const DELIMITER_COUNT = 2; // Some code below assumes 2 delimiters. Can't just add more below without changing code.
  const checkStates:DelimiterCheckState[] = [
    { delimiter:COMMA, firstRowFieldCount:_countFieldsInLine(lines[0], COMMA), failed:false }, 
    { delimiter:TAB, firstRowFieldCount:_countFieldsInLine(lines[0], TAB), failed:false }
  ];
  const areFieldCountsEqual = checkStates[0].firstRowFieldCount === checkStates[1].firstRowFieldCount;
  
  let failedCount = 0;
  for(let lineI = 0; lineI < lines.length; lineI++) {
    for(let checkI = 0; checkI < DELIMITER_COUNT; checkI++) {
      const checkState = checkStates[checkI];
      const rowFieldCount = _countFieldsInLine(lines[lineI], checkState.delimiter);
      if (rowFieldCount !== checkState.firstRowFieldCount) { checkState.failed = true; ++failedCount; }
    }

    if (failedCount === DELIMITER_COUNT) throw new AppException(CvsImportErrorType.UNSTRUCTURED_DATA, 'All field delimiter choices result in unparsable data.');
    if (failedCount === 1) return checkStates[0].failed ? TAB : COMMA; // Only one delimiter works.
    
    
    if (!areFieldCountsEqual && lineI >= SUFFICIENT_UNEQUAL_CHECK) break;
    
    // If field counts are equal, I'll keep looking at rows until one delimiter fails.
    // Or if field counts unequal. I need to check a sufficient number of rows to predict the delimiter with confidence.
  }

  // Looked at every row. Go with the delimiter that has the highest field count, or for a tie, use tab.
  // Why would there be a tie? Single-column CSV files don't use any field delimite. They just use line breaks.
  // And there are some unlikely edge cases where every row of the data has equal numbers of commas and tabs.
  return checkStates[0].firstRowFieldCount > checkStates[1].firstRowFieldCount ? COMMA : TAB;
}

// Beginning of text must be outside of quotes.
function _containsUnclosedQuote(text:string):boolean {
  let pos = 0;
  while(pos < text.length) {
    pos = _findOpenQuote(text, pos);
    if (pos === -1) return false;
    ++pos;
    while(text[pos] === '"') ++pos;
    pos = _findCloseQuote(text, pos);
    if (pos === -1) return true;
    ++pos;
  }
  return false;
}

function _trimTrailingCr(text:string):string {
  return text.endsWith('\r') ? text.slice(0,-1) : text;
}

const REMOVED = '\u0000'; // This value would never appear in CSV data except for some contrived use case.

function _splitCsvLines(csvUnicode:string):string[] {
  // If ends in LF, then remove it to simplify parsing.
  if (csvUnicode.endsWith('\n')) csvUnicode = csvUnicode.slice(0, -1);

  // Split first by row delimiter because it's fast compared to other methods. The rest
  // of the algorithm is fixing the mistakes, if any, of this naive approach.
  const lines = csvUnicode.split('\n'); // Calls to _trimTrailingCr() below will handle the case of rows split by CRLF instead of just LF.
  
  let wereAnyLinesRemoved = false;
  for(let lineI = 0; lineI < lines.length; ++lineI) {
    const line = lines[lineI];
    if (line === REMOVED) continue; // This line was combined with a previous one.

    if (!_containsUnclosedQuote(line)) { // This line was correctly split.
      lines[lineI] = _trimTrailingCr(line);
      continue;
    }

    // The line has an unclosed quote, which means a row delimiter was found inside the quotes
    // and incorrectly used to split a row. E.g. `valueA,"valueB is multi-line text.` <-> `This is the second line of valueB."`
    let lineJ = lineI + 1
    for(; lineJ < lines.length; ++lineJ) {
      // Find the line with the closing quote.
      const closedQuote = _findCloseQuote(lines[lineJ]) !== -1 || lineJ === lines.length - 1; 
      const combinedLine = `${lines[lineI]}\n${lines[lineJ]}`;
      lines[lineI] = closedQuote ? _trimTrailingCr(combinedLine) : combinedLine;
      lines[lineJ] = REMOVED;
      wereAnyLinesRemoved = true;
      if (closedQuote) break;
    }
  }
  return wereAnyLinesRemoved ? lines.filter(line => line !== REMOVED) : lines;
}

function _fieldTextToString(text:string, rowNo:number):string { 
  const trimmed = text.trim(); // Forgive whitespace outside quotes.
  if (trimmed.startsWith('"')) {
    if (!trimmed.endsWith('"')) throw new AppException(CvsImportErrorType.UNSTRUCTURED_DATA, `Field in row #${rowNo} is missing closing quote.`);
    text = trimmed.slice(1, -1);
  }
  return text.replace(/""/g, '"'); // Unescape quotes.
}

function _fieldTextToDateTime(text:string):Date|null {
  if (!isNaN(Number(text))) return null; // The Date conversion below will be successful even with a single text number as input.
  const date = new Date(text.trim()); // Forgive whitespace.
  return isNaN(date.getTime()) ? null : date;
}

function _fieldTextToBoolean(text:string):boolean|null {
  text = text.trim().toLowerCase(); // Forgive whitespace and upper/mixed case.
  if (text === 'true') return true;
  if (text === 'false') return false;
  return null;
}

function _fieldTextToNumeric(text:string):number|null {
  const numeric = Number(text);
  return isNaN(numeric) ? null : numeric;
}

function _fieldTextToValue(text:string, rowNo:number):any {
  // If empty, then return null. Forgive whitespace.
  if (text.trim() === '') return null;

  // If starts with a quote, then it can only be a string.
  if (text.trim().startsWith('"')) return _fieldTextToString(text, rowNo);

  // Then try parsing in this order: date/time, boolean, numeric.
  let value = _fieldTextToDateTime(text) ?? _fieldTextToBoolean(text) ?? _fieldTextToNumeric(text);
  if (value !== null) return value;

  // String is the default if nothing else matches.
  return _fieldTextToString(text, rowNo);
}

function _parseCsvRow(row:string, fieldDelimiter:string, rowNo:number):Row {
  // Similar to splitting rows, I'll split fields first by the delimiter because it's fast, and then fix mistakes, if any.
  let fields = row.split(fieldDelimiter);
  let wereAnyFieldsRemoved = false;
  for(let fieldI = 0; fieldI < fields.length; ++fieldI) {
    const field = fields[fieldI];
    if (field === REMOVED || !_containsUnclosedQuote(field)) continue;
    let fieldJ = fieldI + 1;
    for (; fieldJ < fields.length; ++fieldJ) {
      const combinedField = `${fields[fieldI]}${fieldDelimiter}${fields[fieldJ]}`;
      fields[fieldI] = combinedField;
      fields[fieldJ] = REMOVED;
      wereAnyFieldsRemoved = true;
      if (fields[fieldI].trim().endsWith('"')) break;
    }
  }
  if (wereAnyFieldsRemoved) fields = fields.filter(field => field !== REMOVED);
  return fields.map(fieldText => _fieldTextToValue(fieldText, rowNo))
}

function _valueToString(value:any):string {
  /* istanbul ignore next */ // Unreachable without a debug error in caller.
  if (value === undefined) throw Error('Unexpected');
  return (value === null) ? '' : value.toString();
}

function _parseHeaderRow(headerLine:string, fieldDelimiter:string):Row {
  const row = _parseCsvRow(headerLine, fieldDelimiter, 1);
  for(let fieldI = 0; fieldI < row.length; ++fieldI) {
    if (typeof row[fieldI] !== 'string') row[fieldI] = _valueToString(row[fieldI]); // Be forgiving and try to preserve intent.
    if (row[fieldI].length > MAX_FIELDNAME_LENGTH) throw new AppException(CvsImportErrorType.UNSTRUCTURED_DATA, 'Field name in first row is too long.');
  }
  return row;
}



// Can throw CvsImportError.NO_DATA, FIELD_COUNT_MISMATCH, UNSTRUCTURED_DATA, TOO_MANY_FIELDS 
export function csvUnicodeToRowArray(csvUnicode:string, includeHeaders:boolean):Rowset {
  if (csvUnicode.trim() === '') throw new AppException(CvsImportErrorType.NO_DATA, 'No data found in CSV text.');

  const lines = _splitCsvLines(csvUnicode);  
  const fieldDelimiter = _findFieldDelimiter(lines);
  const rows:Rowset = [];
  
  let fromRowI = 0;
  const fieldCount = _countFieldsInLine(lines[0], fieldDelimiter);
  if (fieldCount > MAX_FIELD_COUNT) throw new AppException(CvsImportErrorType.TOO_MANY_FIELDS, "Too many fields found in first row.");
  if (includeHeaders) {
    rows.push(_parseHeaderRow(lines[0], fieldDelimiter));
    fromRowI = 1;
  } else {
    rows.push(generateColumnNames(fieldCount));
  }
  
  for(let rowI = fromRowI; rowI < lines.length; ++rowI) {
    const row = _parseCsvRow(lines[rowI], fieldDelimiter, rowI+1);
    if (row.length !== fieldCount) throw new AppException(CvsImportErrorType.FIELD_COUNT_MISMATCH, `Row #${rowI+1} has a different number of fields than the first row.`);
    rows.push(row);
  }
  
  return rows;
}

// Can throw CvsImportError.NO_DATA, FIELD_COUNT_MISMATCH, UNSTRUCTURED_DATA, TOO_MANY_FIELDS
export function csvUtf8ToRowArray(csvBytes:Uint8Array, includesHeaders:boolean):Rowset {
  const csvUnicode = decodeUtf8(csvBytes);
  return csvUnicodeToRowArray(csvUnicode, includesHeaders);
}