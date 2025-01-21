import { useStorageZone, syncFilesToStorage, ANSI_START_RED, ANSI_RESET } from "./bunnyUtil.js";

function _fatalError(message) {
  if (!message) message = 'Exiting script due to preceding error.';
  console.log(`${ANSI_START_RED}Fatal Error:${ANSI_RESET} ${message}`);
  process.exit(1);
}

async function main(bunnyApiKey, storageZoneName, appName, commitHash) {
  if (!bunnyApiKey) _fatalError('Missing BUNNY_API_KEY environment variable.'); 
  if (!storageZoneName) _fatalError('Missing STORAGE_ZONE_NAME environment variable.');
  if (!appName) _fatalError('Missing APP_NAME environment variable.');
  if (!commitHash) _fatalError('Missing COMMIT_HASH environment variable.');
  
  const shortHash = commitHash.length > 7 ? commitHash.slice(0, 7) : commitHash;
  const storagePath = `/${appName}/${shortHash}/`;
  if (
    !await useStorageZone(storageZoneName) ||
    !await syncFilesToStorage(storagePath, './dist')
  ) _fatalError();
}

// Receives input via environment vars.
const bunnyApiKey = process.env.BUNNY_API_KEY; // From deploy.yml, take care to set this *ONLY* in the step that it is used.
const storageZoneName = process.env.STORAGE_ZONE_NAME;
const appName = process.env.APP_NAME;
const commitHash = process.env.COMMIT_HASH;

main(bunnyApiKey, storageZoneName, appName, commitHash);