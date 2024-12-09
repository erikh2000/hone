export function keyToPath(key:string):string {
  const pathEnd = key.lastIndexOf('/') + 1;
  return key.substring(0, pathEnd);
}

export function keyToName(key:string):string {
  const pathEnd = key.lastIndexOf('/') + 1;
  return key.substring(pathEnd);
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

export function splitFilenameAndExtension(filenameWithExtension:string):[filename:string, extension:string] {
  if (filenameWithExtension === '') return ['', ''];
  const tokens = filenameWithExtension.split('.');
  if (tokens.length === 1) return [tokens[0], '']; // No extension.
  const extension = tokens.pop()?.toLowerCase() as string; // Implied by previous code that pop() will not return undefined.
  const filename = tokens.join('.');
  return [filename, extension];
}