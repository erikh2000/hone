export function isEmpty(value:any):boolean {
  return value == null || value === '';
}

function isNode():boolean { 
  return typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
}

export function encodeUtf8(text: string):Uint8Array {
  /* istanbul ignore next */ // Always true in Node.js.
  if (isNode()) {
    const bufferData = Buffer.from(text, 'utf-8');
    return new Uint8Array(bufferData);
  } else {
    /* istanbul ignore next */ // Never executed in Node.js.
    return new TextEncoder().encode(text);
  }
}