// Don't put I/O in here. Just parsing, concatenation, and text manipulation utilities.
const DSIF_VERSION = '1.0';

// '/app', 'app', '_app', '/_app', '_app/', etc. -> 'app'
function _nakedAppName(appName) {
  while (appName.startsWith('/') || appName.startsWith('_')) appName = appName.substring(1);
  const appNameEndPos = appName.indexOf('/');
  if (appNameEndPos === -1) return appName;
  return appName.substring(0, appNameEndPos);
}

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
  if (version === DSIF_VERSION) return version;
  throw Error(`Unsupported stage index format version ${version}.`);
}

export function createStageIndex(appName, productionVersion, rollbackVersion, stageVersion) {
  const stageIndexUrl = `/_${_nakedAppName(appName)}/${stageVersion}/`;
  return `` +
    `<!DOCTYPE html><html><head><title>Stage Index for ${appName}</title><script>\n` +
    `<!-- v${DSIF_VERSION} Decent Stage Index Format. Hand-edit at your own risk! -->\n` +
    `const productionVersion='${productionVersion}';\n` +
    `const rollbackVersion='${rollbackVersion}';\n` +
    `const stageVersion='${stageVersion}';\n` +
    `window.location.href='${stageIndexUrl}';\n` +
    `</script></head><body></body></html>`;
}

// This function is coupled to the specific format in _createStageIndexText. So I can take many parsing shortcuts.
export function parseStageIndex(htmlText) {
  _findSupportedStageIndexFormat(htmlText); // If you have more than one supported version in the future, use the returned version# to branch to correct parsing logic.
  const productionVersion = _parseVariableValue(htmlText, 'productionVersion');
  const rollbackVersion = _parseVariableValue(htmlText, 'rollbackVersion');
  const stageVersion = _parseVariableValue(htmlText, 'stageVersion');
  return { productionVersion, rollbackVersion, stageVersion };
}

export function appNameToStageIndexPath(appName) {
  appName = _nakedAppName(appName);
  return `/_${appName}/index.html`;
}

export function createEmptyVarsObject() {
  return {
    productionVersion:'',
    rollbackVersion:'',
    stageVersion:''
  };
}