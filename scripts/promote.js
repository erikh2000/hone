import { useStorageZoneSubtask, getCurrentStorageZone } from "./util/storageUtil.js";
import { logError, logSuccess, fatalError, logOverallSuccess } from "./util/colorfulMessageUtil.js";
import { updateAppVersionsForStagedPromotion, revertAppVersions } from "./util/stageIndexUtil.js";
import { findAppOriginEdgeRule, detectAppOriginEdgeRuleNonConformance, createAppOriginEdgeRule, writeEdgeRule } from "./util/edgeRuleUtil.js";
import { getAppUrl, nakedAppName, pullZoneToHostNames } from "./util/pathUtil.js";
import { purgeLandingUrl } from "./util/purgeUtil.js";

async function _setAppOrigin(pullZone, appName, productionVersion) {
  const { hostName:pullZoneDomainName, systemHostName:originDomainName } = pullZoneToHostNames(pullZone);
  const { EdgeRules:edgeRules, Id:pullZoneId } = pullZone;
  const edgeRule = await findAppOriginEdgeRule(edgeRules, pullZoneDomainName, appName);
  if (edgeRule) {
    const nonconformReason = detectAppOriginEdgeRuleNonConformance(edgeRule);
    if (nonconformReason) throw Error(`Unwilling to overwrite existing app origin edge rule for ${pullZoneDomainName}/${appName} because ${nonconformReason}.`);
  }
  const guid = edgeRule?.Guid;
  const nextEdgeRule = createAppOriginEdgeRule(guid, appName, pullZoneDomainName, originDomainName, productionVersion);
  await writeEdgeRule(pullZoneId, nextEdgeRule);
  await purgeLandingUrl(getAppUrl(pullZoneDomainName, appName));
}

// Definitely NOT idempotent. This makes the staged version of the app live, and it's no longer staged.
async function _promoteStagedAppSubtask(appName) {
  let originalVersionInfo = null;
  try {
    const currentStorageZone = await getCurrentStorageZone();
    if (!currentStorageZone) { throw new Error('Call useStorageZone() to set a current storage zone.'); }
    const { PullZones:pullZones} = currentStorageZone;
    if (!pullZones.length) throw Error(`${Name} storage zone has no pull zone associated with it.`);
    const pullZone = pullZones[0];

    originalVersionInfo = await updateAppVersionsForStagedPromotion(appName);
    const nextProductionVersion = originalVersionInfo.stageVersion;
    await _setAppOrigin(pullZone, appName, nextProductionVersion);
    logSuccess(`Promoted staged version ${nextProductionVersion} of ${appName} to production.`);
    return true;
  } catch(err) {
    const stageVersion = `${originalVersionInfo.stageVersion} ` ?? '';
    logError(`Failed to promote staged version ${stageVersion}of ${appName} to production.`, err);
    if (originalVersionInfo) {
      console.log('Rolling back stage index to previous set of versions.');
      try {
        await revertAppVersions(appName, originalVersionInfo);
      } catch(revertErr) {
        logError('The system is now in an inconsistent state! Recommending to redeploy the app to fix stage index.', revertErr);
      }
    }
    return null;
  }
}

// Promotes the current staged version of an app to production, making it live. It's necessary for at least one
// deployment to have been made first, so that there is a staged version to promote.
async function main(bunnyApiKey, storageZoneName, appName) {
  if (!bunnyApiKey) fatalError('Missing BUNNY_API_KEY environment variable.'); 
  if (!storageZoneName) fatalError('Missing STORAGE_ZONE_NAME environment variable.');
  if (!appName) fatalError('Missing APP_NAME environment variable.');
  appName = nakedAppName(appName);

  if (
    !await useStorageZoneSubtask(storageZoneName) ||
    !await _promoteStagedAppSubtask(appName)
  ) fatalError();
  logOverallSuccess(`Promoted ${appName} to production.`);
}

// Receives input via environment vars.
const bunnyApiKey = process.env.BUNNY_API_KEY; // From deploy.yml, take care to set this *ONLY* in the step that it is used.
const storageZoneName = process.env.STORAGE_ZONE_NAME;
const appName = process.env.APP_NAME;

main(bunnyApiKey, storageZoneName, appName);