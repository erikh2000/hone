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

export function decodeUtf8(bytes:Uint8Array):string {
  /* istanbul ignore next */ // Always true in Node.js.
  if (isNode()) {
    const bufferData = Buffer.from(bytes);
    return bufferData.toString('utf-8');
  } else {
    /* istanbul ignore next */ // Never executed in Node.js.
    return new TextDecoder().decode(bytes);
  }
}

export function fillTemplate(template:string, variables:any):string {
  let filled = template;
  const variableNames = Object.keys(variables);
  variableNames.forEach(variableName => {
    const variableValue = variables[variableName];
    filled = filled.replaceAll('{' + variableName + '}', variableValue);
  });
  return filled;
}