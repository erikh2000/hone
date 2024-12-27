function _getNextColumnName(columnName:string):string {
  if (columnName === '') return 'A';
  if (columnName === 'ZZ') throw Error('Unexpected'); // This is beyond the maximum allowed field count.
  if (columnName.length === 1) {
    const charCode = columnName.charCodeAt(0);
    if (charCode === 'Z'.charCodeAt(0)) return 'AA';
    return String.fromCharCode(charCode + 1);
  }
  if (columnName.length === 2) {
    const charCode1 = columnName.charCodeAt(0);
    const charCode2 = columnName.charCodeAt(1);
    if (charCode2 === 'Z'.charCodeAt(0)) return String.fromCharCode(charCode1 + 1) + 'A';
    return columnName[0] + String.fromCharCode(charCode2 + 1);
  }
  /* istanbul ignore next */ // Unreachable without a debug error in caller.
  throw Error('Unexpected');
}

export function generateColumnNames(fieldCount:number):string[] {
  let columnName = '';
  const columnNames = [];
  for(let columnI = 0; columnI < fieldCount; ++columnI) {
    columnName = _getNextColumnName(columnName);
    columnNames.push(columnName);
  }
  return columnNames;
}