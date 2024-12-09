export function escapeRegexCharacters(text:string):string {
  return text.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function createNonGlobalRegex(regex:RegExp):RegExp {
  if (!regex.global) return regex; // No change needed, so return unmodified regex.
  const flags = regex.flags.replace('g', '');
  return new RegExp(regex, flags);
}