import { findNonWhiteSpace } from "./regExUtil";

export type SIMPLE_RESPONSE_SUPPORTED_TYPES = string|number|boolean|null;

function _toSloppySupportedType(value:any):SIMPLE_RESPONSE_SUPPORTED_TYPES {
  if (value === null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value;
  try {
    return JSON.stringify(value); // undefined, object, array, etc.
  } catch (_e) {
    /* istanbul ignore next */ // Unreachable but defensive code on next line.
    return "" + value; // Fallback to string representation.
  }
}

/* There is a "simple response" JSON format this app uses: {"r": "your answer"}. I assume the passed value at least 
   roughly follows that format, but may be malformed due to hallucinations. */
export function parseSimpleResponse(response:string):SIMPLE_RESPONSE_SUPPORTED_TYPES {
  // Try with the JSON parser first, because native code is faster. If it fails, the JSON is malformed and we can try the sloppy parser.
  try {
    const json = JSON.parse(response);
    if (json && json.r !== undefined) return _toSloppySupportedType(json.r);
  } catch(_e) {
    // Expected case. Fall through to the sloppy parser.
  }

  // Look for "r".
  let pos = response.indexOf('"r"');
  if (pos === -1) return "";

  // Look for ":" after that.
  pos = response.indexOf(':', pos+1);
  if (pos === -1) return "";

  // Find the first non-whitespace char after that.
  pos = findNonWhiteSpace(response, pos+1);
  if (pos === -1) return "";
  
  if (response[pos] === '"') {
    // Capture all text to the end of the string or the next quote.
    const nextQuote = response.indexOf('"', pos+1);
    const endPos = nextQuote === -1 ? response.length : nextQuote;
    if (endPos - pos < 2) return "";
    return response.substring(pos + 1, endPos).trim();
  }

  // Otherwise it's a non-string data type or something more complex that is incorrect for the simple response format.
  // Get the rest of the string but remove any trailing whitespace or ending curly brace.
  let remaining = response.substring(pos).trim();
  if (remaining.endsWith('}')) remaining = remaining.substring(0, remaining.length-1).trim();

  // null?
  if (remaining === 'null') return null;

  // boolean?
  if (remaining.toLowerCase() === 'true' || remaining.toLowerCase() === 'false') return remaining.toLowerCase() === 'true';

  // number?
  const num = Number(remaining);
  if (!isNaN(num)) return num;

  // Otherwise, return as a string. If it's a complex object, it will be a string representation of that object.
  return remaining;
}