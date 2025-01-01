function _inferPrecision(date:Date):string {
  if (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0) {
    return "date";
  }
  if (date.getFullYear() === 1970 && date.getMonth() === 0 && date.getDate() === 1) {
    return "time";
  }
  return "datetime";
}

function _formatDate(date:Date):string {
  const precision = _inferPrecision(date);
  if (precision === "date") return date.toLocaleDateString();
  if (precision === "time") return date.toLocaleTimeString();
  return date.toLocaleString();
}

export function cellValueToText(cellValue:any):string {
  if (cellValue === null || cellValue === undefined) return '';

  const valueType = typeof cellValue;
  if (valueType === 'boolean') return cellValue ? 'true' : 'false';
  if (cellValue instanceof Date) return _formatDate(cellValue);
  
  // Covers numbers, strings, objects, and anything unknown.
  return '' + cellValue;
}