export function findUniqueName(baseName:string, existingNames:string[]):string {
  let name = baseName;
  let suffix = 1;
  while (existingNames.includes(name)) {
    name = `${baseName} (${suffix})`;
    suffix++;
  }
  return name;
}