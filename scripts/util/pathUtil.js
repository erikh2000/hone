// No I/O.

// '/app', 'app', '_app', '/_app', '_app/', etc. -> 'app'
export function nakedAppName(appName) {
  while (appName.startsWith('/') || appName.startsWith('_')) appName = appName.substring(1);
  const appNameEndPos = appName.indexOf('/');
  if (appNameEndPos === -1) return appName;
  return appName.substring(0, appNameEndPos);
}

// e.g. /_app/
export function appNameToStagePath(appName) {
  appName = nakedAppName(appName);
  return `/_${appName}/`;
}

// e.g. /_app/index.html
export function appNameToStageIndexPath(appName) {
  return `${appNameToStagePath(appName)}index.html`;
}

// e.g. /_app/1111111/
export function appNameAndVersionToStagePath(appName, version) {
  return `${appNameToStagePath(appName)}${version}/`;
}

// https://example.com/app -> https://example.com/app/  
// https://example.com/app/ -> https://example.com/app/ 
// https://example.com/app/index.html -> https://example.com/app/
// http://example.com/app -> http://example.com/app/
// https://example.com/app/subfolder -> https://example.com/app/
// https://example.com/ -> throws
// https://example.com -> throws
export function normalizeAppUrl(url) {
  // Find scheme end ("://").
  const SCHEME_END = '://';
  let pos = url.indexOf(SCHEME_END);
  if (pos === -1) throw Error(`Invalid URL: No scheme found in ${url}.`);
  pos += SCHEME_END.length;

  // Find domain end ("/").
  pos = url.indexOf('/', pos);
  if (pos === -1) throw Error(`Invalid URL: No domain found in ${url}.`);
  pos++;

  // Find app name end ("/" or end of text).
  if (pos >= url.length) throw Error(`Invalid URL: No app name found in ${url}.`);
  const appNameEnd = url.indexOf('/', pos);
  return appNameEnd === -1 ? url + '/' : url.substring(0, appNameEnd + 1);
}

export function getAppUrl(pullZoneDomainName, appName) {
  return `https://${pullZoneDomainName}/${appName}/`;
}

export function pullZoneToHostNames(pullZone) {
  const result = {};
  const { Hostnames:hostNames } = pullZone;
  for(let i = 0; i < hostNames.length; ++i) {
    const hostName = hostNames[i];
    if (hostName.IsSystemHostname) {
      result.systemHostName = hostName.Value;
    } else {
      if (result.hostName) throw Error('pullZone has multiple hostnames. Not sure which to use.'); // I think it's possible on Bunny, but not aligned with my deployment conventions.
      result.hostName = hostName.Value;
    }
  }
  return result;
}

export function getPullZoneDomainName(pullZone) {
  return pullZoneToHostNames(pullZone).hostName;
}