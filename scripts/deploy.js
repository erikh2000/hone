import { doesDirectoryExist, putText } from "./util/localFileUtil.js";
import { useStorageZoneSubtask,  syncFilesToStorageSubtask } from "./util/storageUtil.js";
import { logSuccess, logError, logOverallSuccess, fatalError } from "./util/colorfulMessageUtil.js";
import { shortCommitHash, updateAppStageVersionSubtask } from "./util/stageIndexUtil.js";
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
}

// Receives input via environment vars.
const bunnyApiKey = process.env.BUNNY_API_KEY; // From deploy.yml, take care to set this *ONLY* in the step that it is used.
const storageZoneName = process.env.STORAGE_ZONE_NAME;
const appName = process.env.APP_NAME;
const commitHash = process.env.COMMIT_HASH;

main(bunnyApiKey, storageZoneName, appName, commitHash);