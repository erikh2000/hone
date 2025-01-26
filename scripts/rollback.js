import { useStorageZoneSubtask, getCurrentStorageZone } from "./util/storageUtil.js";
import { logError, logSuccess, fatalError, logOverallSuccess } from "./util/colorfulMessageUtil.js";
import { updateAppVersionsForRollback, revertAppVersions } from "./util/stageIndexUtil.js";
import { setAppOrigin } from "./util/edgeRuleUtil.js";
import { nakedAppName } from "./util/pathUtil.js";

// Definitely NOT idempotent. This makes the rollback version of the app live. For failures, there is a "rollback" of a rollback
// to try to leave everything in the original state.
async function _rollbackAppSubtask(appName) {
  let originalVersionInfo = null;
  try {
    const currentStorageZone = await getCurrentStorageZone();
    if (!currentStorageZone) { throw new Error('Call useStorageZone() to set a current storage zone.'); }
    const { PullZones:pullZones} = currentStorageZone;
    if (!pullZones.length) throw Error(`${Name} storage zone has no pull zone associated with it.`);
    const pullZone = pullZones[0];

    originalVersionInfo = await updateAppVersionsForRollback(appName);
    const nextProductionVersion = originalVersionInfo.rollbackVersion;

    await setAppOrigin(pullZone, appName, nextProductionVersion);
    logSuccess(`Rolled back to version ${nextProductionVersion} of ${appName}.`);
    return true;
  } catch(err) {
    const rollbackVersion = `${originalVersionInfo?.rollbackVersion} ` ?? '';
    logError(`Failed to roll back to version ${rollbackVersion}of ${appName}.`, err);
    if (originalVersionInfo) {
      console.log('Reverting stage index to previous set of versions.');
      try {
        await revertAppVersions(appName, originalVersionInfo);
      } catch(revertErr) {
        logError('The system is now in an inconsistent state! Recommending to redeploy the app to fix stage index.', revertErr);
      }
    }
    return null;
  }
}

// Rolls back the current production version of an app to whatever was previously deployed there. It's necessary for at least one
// promotion to have been made first and that the rollback version hasn't been deleted.
async function main(bunnyApiKey, storageZoneName, appName) {
  if (!bunnyApiKey) fatalError('Missing BUNNY_API_KEY environment variable.'); 
  if (!storageZoneName) fatalError('Missing STORAGE_ZONE_NAME environment variable.');
  if (!appName) fatalError('Missing APP_NAME environment variable.');
  appName = nakedAppName(appName);

  if (
    !await useStorageZoneSubtask(storageZoneName) ||
    !await _rollbackAppSubtask(appName)
  ) fatalError();
  logOverallSuccess(`Rolled back ${appName} to previously deployed version.`);
}

// Receives input via environment vars.
const bunnyApiKey = process.env.BUNNY_API_KEY; // From deploy.yml, take care to set this *ONLY* in the step that it is used.
const storageZoneName = process.env.STORAGE_ZONE_NAME;
const appName = process.env.APP_NAME;

main(bunnyApiKey, storageZoneName, appName);