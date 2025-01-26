import { DECENT_TOOLS_VERSION, VERSION } from "./toolVersionUtil.js";
import { logError, logSuccess } from "./colorfulMessageUtil.js";
import { getPullZoneDomainName, appNameToStageIndexPath } from "./pathUtil.js";
import { purgeLandingUrl } from './purgeUtil.js';
import { storageGetText, storagePutText } from "./bunnyHttpUtil.js";
import { getCurrentStorageZone } from "./storageUtil.js";

function _parseStageIndexFormat(htmlText) {
  const versionPrefix = `<!-- v`;
  const versionPrefixStartPos = htmlText.indexOf(versionPrefix);
  if (!versionPrefixStartPos) return null;
  const versionStartPos = versionPrefixStartPos + versionPrefix.length;
  const versionEndPos = htmlText.indexOf(' ', versionStartPos);
  if (!versionEndPos) return null;
  return htmlText.substring(versionStartPos, versionEndPos);
}

function _parseVariableValue(html, variableName) {
  const variablePrefix = ` ${variableName}='`;
  const variablePrefixStartPos = html.indexOf(variablePrefix);
  if (!variablePrefixStartPos) return null;
  const valueStartPos = variablePrefixStartPos + variablePrefix.length;
  const valueEndPos = html.indexOf(`'`, valueStartPos);
  if (!valueEndPos) return null;
  return html.substring(valueStartPos, valueEndPos);
}

function _findSupportedStageIndexFormat(htmlText) {
  const version = _parseStageIndexFormat(htmlText);
  if (!version) throw Error(`Failed to parse stage index format version.`);
  if (version === VERSION) return version;
  throw Error(`Unsupported stage index format version ${version}.`);
}

function _createStageIndex(appName, productionVersion, rollbackVersion, stageVersion) {
  const stageIndexUrl = `/_${appName}/${stageVersion}/`;
  return `` +
    `<!DOCTYPE html><html><head><title>Stage Index for ${appName}</title><script>\n` +
    `<!-- ${DECENT_TOOLS_VERSION}. Hand-edit at your own risk! -->\n` +
    `const productionVersion='${productionVersion}';\n` +
    `const rollbackVersion='${rollbackVersion}';\n` +
    `const stageVersion='${stageVersion}';\n` +
    `window.location.href='${stageIndexUrl}';\n` +
    `</script></head><body></body></html>`;
}

// This function is coupled to the specific format in _createStageIndexText. So I can take many parsing shortcuts.
function _parseStageIndex(htmlText) {
  _findSupportedStageIndexFormat(htmlText); // If you have more than one supported version in the future, use the returned version# to branch to correct parsing logic.
  const productionVersion = _parseVariableValue(htmlText, 'productionVersion');
  const rollbackVersion = _parseVariableValue(htmlText, 'rollbackVersion');
  const stageVersion = _parseVariableValue(htmlText, 'stageVersion');
  return { productionVersion, rollbackVersion, stageVersion };
}

function _createEmptyVarsObject() {
  return {
    productionVersion:'',
    rollbackVersion:'',
    stageVersion:''
  };
}

async function _fetchAppVersionInfo(domainName, storageZoneName, password, appName) {
  const stageIndexPath = appNameToStageIndexPath(appName);
  let htmlText;
  try {
    htmlText = await storageGetText(domainName, storageZoneName, password, stageIndexPath);
  } catch(_ignored) { // Expected condition - index.html not created yet.
    return _createEmptyVarsObject();
  }
  return _parseStageIndex(htmlText); // This may throw for an invalid stage index file.
}

async function _writeAppVersionInfo(pullDomainName, storageDomainName, storageZoneName, password, appName, productionVersion, rollbackVersion, stageVersion) {
  const stageIndexText = _createStageIndex(appName, productionVersion, rollbackVersion, stageVersion);
  const stageIndexPath = appNameToStageIndexPath(appName);
  await storagePutText(storageDomainName, storageZoneName, password, stageIndexPath, stageIndexText);
  await purgeLandingUrl(`https://${pullDomainName}${stageIndexPath}`); // This depends on pull zone being mapped to storage zone /* -> /*. For decentapps.net staging app directories, that is true.
}

/*
  Exports
*/

// Idempotent. This writes the /_appName/index.html file to accomplish 2 things: correct version#s are inside of it,
// and it redirects to the last-deployed-to-stage version of the app. (Useful to be able to browse to '/_appName/' rather
// than '/_appName/aaaaaaa/' while testing staging.)
export async function updateAppStageVersionSubtask(appName, stageVersion) {
  try {
    const currentStorageZone = await getCurrentStorageZone();
    if (!currentStorageZone) { throw new Error('Call useStorageZone() to set a current storage zone.'); }
    const { StorageHostname:storageHostName, ReadOnlyPassword:readOnlyPassword, Password:password, Name:storageZoneName, PullZones:pullZones} = currentStorageZone;
    const pullZoneDomainName = getPullZoneDomainName(pullZones[0]);
    const originalVersionInfo = await _fetchAppVersionInfo(storageHostName, storageZoneName, readOnlyPassword, appName);
    const { productionVersion, rollbackVersion } = originalVersionInfo;
    await _writeAppVersionInfo(pullZoneDomainName, storageHostName, storageZoneName, password, appName, productionVersion, rollbackVersion, stageVersion);
    logSuccess(`Updated stage version of ${appName} to ${stageVersion}.`);
    return originalVersionInfo;
  } catch(err) {
    logError(`Failed to update stage version of ${appName}.`, err);
    return null;
  }
}

// NOT idempotent.
export async function updateAppVersionsForStagedPromotion(appName) {
  let originalVersionInfo = null;
  const currentStorageZone = await getCurrentStorageZone();
  if (!currentStorageZone) { throw new Error('Call useStorageZone() to set a current storage zone.'); }
  const { StorageHostname:storageHostName, ReadOnlyPassword:readOnlyPassword, Password:password, Name:storageZoneName, PullZones:pullZones} = currentStorageZone;
  const pullZoneDomainName = getPullZoneDomainName(pullZones[0]);

  originalVersionInfo = await _fetchAppVersionInfo(storageHostName, storageZoneName, readOnlyPassword, appName);
  if (originalVersionInfo.stageVersion === '') { throw new Error(`No version of ${appName} is currently staged. Aborted with no changes.`)};
  if (originalVersionInfo.stageVersion === originalVersionInfo.productionVersion) { throw new Error(`Staged version of ${appName} already matches production version. Aborted with no changes.`)};
  if (originalVersionInfo.productionVersion === '') { console.log(`First promotion of ${appName}, assuming stage index is correct.`)};
  const nextRollbackVersion = originalVersionInfo.productionVersion, nextStageVersion = originalVersionInfo.stageVersion, nextProductionVersion = originalVersionInfo.stageVersion;
  await _writeAppVersionInfo(pullZoneDomainName, storageHostName, storageZoneName, password, appName, nextProductionVersion, nextRollbackVersion, nextStageVersion);
  logSuccess(`Updated stage index to promote stage version ${originalVersionInfo.stageVersion} of ${appName} to production.`);
  return originalVersionInfo;
}

// NOT idempotent.
export async function updateAppVersionsForRollback(appName) {
  let originalVersionInfo = null;
  const currentStorageZone = await getCurrentStorageZone();
  if (!currentStorageZone) { throw new Error('Call useStorageZone() to set a current storage zone.'); }
  const { StorageHostname:storageHostName, ReadOnlyPassword:readOnlyPassword, Password:password, Name:storageZoneName, PullZones:pullZones} = currentStorageZone;
  const pullZoneDomainName = getPullZoneDomainName(pullZones[0]);

  originalVersionInfo = await _fetchAppVersionInfo(storageHostName, storageZoneName, readOnlyPassword, appName);
  if (originalVersionInfo.rollbackVersion === '') { throw new Error(`No rollback version of ${appName} is currently available. Aborted with no changes.`)};
  const nextRollbackVersion = '', nextStageVersion = originalVersionInfo.stageVersion, nextProductionVersion = originalVersionInfo.rollbackVersion;
  await _writeAppVersionInfo(pullZoneDomainName, storageHostName, storageZoneName, password, appName, nextProductionVersion, nextRollbackVersion, nextStageVersion);
  logSuccess(`Updated stage index to roll back to version ${originalVersionInfo.rollbackVersion} of ${appName}.`);
  return originalVersionInfo;
}

export async function revertAppVersions(appName, originalVersionInfo) {
  const currentStorageZone = await getCurrentStorageZone();
  if (!currentStorageZone) { throw new Error('Call useStorageZone() to set a current storage zone.'); }
  const { StorageHostname:storageHostName, Password:password, Name:storageZoneName, PullZones:pullZones} = currentStorageZone;
  const pullZoneDomainName = getPullZoneDomainName(pullZones[0]);
  const { productionVersion, rollbackVersion, stageVersion } = originalVersionInfo;
  await _writeAppVersionInfo(pullZoneDomainName, storageHostName, storageZoneName, password, appName, productionVersion, rollbackVersion, stageVersion);
}

export async function getActiveVersions(appName) {
  const currentStorageZone = await getCurrentStorageZone();
  if (!currentStorageZone) { throw new Error('Call useStorageZone() to set a current storage zone.'); }
  const { StorageHostname:storageHostName, ReadOnlyPassword:readOnlyPassword, Name:storageZoneName } = currentStorageZone;
  const {productionVersion, rollbackVersion, stageVersion} = await _fetchAppVersionInfo(storageHostName, storageZoneName, readOnlyPassword, appName);
  const activeVersions = [];

  function _addIfShould(version) { if (version !== '' && !activeVersions.includes(version)) activeVersions.push(version);}

  _addIfShould(productionVersion);
  _addIfShould(rollbackVersion);
  _addIfShould(stageVersion);
  return activeVersions;
}

export function shortCommitHash(commitHash) {
  return commitHash.length > 7 ? commitHash.slice(0, 7) : commitHash;
}