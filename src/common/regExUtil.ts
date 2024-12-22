export function escapeRegexCharacters(text:string):string {
  return text.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function createNonGlobalRegex(regex:RegExp):RegExp {
  if (!regex.global) return regex; // No change needed, so return unmodified regex.
  const flags = regex.flags.replace('g', '');
  return new RegExp(regex, flags);
}

// Return index of first non-whitespace char or -1 if no non-whitespace characters found.
export function findNonWhiteSpace(text:string, fromPos:number = 0):number {
  for (let i = fromPos; i < text.length; i++) {
    if (/\S/.test(text[i])) return i;
  }
  return -1;
}

export function findWhiteSpace(text:string, fromPos:number = 0):number {
  for (let i = fromPos; i < text.length; i++) {
    if (/\s/.test(text[i])) return i;
  }
  return -1;
}