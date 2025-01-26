import { doesDirectoryExist, putText } from "./util/localFileUtil.js";
import { useStorageZoneSubtask,  syncFilesToStorageSubtask, findOldAppVersions, deleteAppVersions } from "./util/storageUtil.js";
import { logSuccess, logError, logOverallSuccess, fatalError } from "./util/colorfulMessageUtil.js";
import { getActiveVersions, shortCommitHash, updateAppStageVersionSubtask } from "./util/stageIndexUtil.js";
import { nakedAppName } from "./util/pathUtil.js";

// Idempotent.
export async function _writeAppVersionFileSubtask(version, localFilePath) {
  try {
    await putText(localFilePath, version);
    logSuccess(`Wrote version ${version} to ${localFilePath}.`);
    return true;
  } catch(err) {
    logError(`Failed to write version ${version} to ${localFilePath}.`, err);
    return null;
  }
}

// Idempotent, except for edge case of time changing between calls and selecting more versions to delete past the retention period.
const VERSION_RETENTION_MONTHS = 3;
export async function _deleteOldInactiveVersionsSubtask(appName) {
  try{
    const activeVersions = await getActiveVersions(appName);
    const oldVersions = await findOldAppVersions(appName, VERSION_RETENTION_MONTHS);
    const oldInactiveVersions = oldVersions.filter((version) => !activeVersions.includes(version));
    if (!oldInactiveVersions.length) { logSuccess(`No old inactive versions of ${appName} to delete.`); return true; }
    await deleteAppVersions(appName, oldInactiveVersions);
    logSuccess(`Deleted old inactive versions of ${appName}.`);
    return true;
  } catch(err) {
    logError(`Failed to delete old inactive versions of ${appName}.`, err);
    return null;
  }
}

// Deploys the local files at ./dist to the storage zone, making it "staged". It won't be live at the production URLs, but
// accessible from a staging URL. If the app name is "test", the staged version will be accessible at "/_test/" and the live
// version of the app will be at "/test/" unchanged by this operation. Each deployment creates a new directory under 
// "/_test/" with the commit hash.
async function main(bunnyApiKey, storageZoneName, appName, commitHash) {
  if (!bunnyApiKey) fatalError('Missing BUNNY_API_KEY environment variable.'); 
  if (!storageZoneName) fatalError('Missing STORAGE_ZONE_NAME environment variable.');
  if (!appName) fatalError('Missing APP_NAME environment variable.');
  if (!commitHash) fatalError('Missing COMMIT_HASH environment variable.');
  
  if (!await doesDirectoryExist('./dist')) fatalError('Missing "./dist" directory. Did build complete? Running from wrong directory?');

  appName = nakedAppName(appName);
  const shortHash = shortCommitHash(commitHash);
  const storagePath = `/_${appName}/${shortHash}/`;
  if (
    !await useStorageZoneSubtask(storageZoneName) ||
    !await _writeAppVersionFileSubtask(shortHash, './dist/version.txt') ||
    !await syncFilesToStorageSubtask(storagePath, './dist') ||
    !await updateAppStageVersionSubtask(appName, shortHash)
  ) fatalError();
  logOverallSuccess(`Deployed ${appName} version ${shortHash} to staging.`);
  if (!await _deleteOldInactiveVersionsSubtask(appName)) console.warn('Cleanup action failed and should be investigated, but deployment was successful.');
}

// Receives input via environment vars.
const bunnyApiKey = process.env.BUNNY_API_KEY; // From deploy.yml, take care to set this *ONLY* in the step that it is used.
const storageZoneName = process.env.STORAGE_ZONE_NAME;
const appName = process.env.APP_NAME;
const commitHash = process.env.COMMIT_HASH;

main(bunnyApiKey, storageZoneName, appName, commitHash);