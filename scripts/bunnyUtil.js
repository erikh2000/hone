
import { createReadStream } from 'fs';
import * as path from 'path';
import { opendir } from 'fs/promises';
import { createHash } from 'crypto';
import { parseStageIndex, createStageIndex, appNameToStageIndexPath, createEmptyVarsObject } from './stageIndexUtil.js';
import { httpsRequest, httpsRequestWithBodyFromFile, httpsRequestWithBodyFromText } from './httpUtil.js';

/* Bunny's docs on storage API limits - https://docs.bunny.net/reference/edge-storage-api-limits
   If there's only one ongoing upload to my storage zone, a higher number, e.g. 50 should work.
   Erring on the side of caution in case I start a couple of deployments simultaneously. */
const DEFAULT_MAX_CONCURRENT_REQUESTS = 20;

// ANSI text-formatting codes for console output.
export const ANSI_START_GREEN = "\x1b[32m";
export const ANSI_START_RED = "\x1b[31m";
export const ANSI_START_BOLD = "\x1b[1m";
export const ANSI_RESET = "\x1b[0m";

function _logError(message, exception) {
  console.error(`${ANSI_START_RED}${ANSI_START_BOLD}Error: ${ANSI_RESET}${message}`);
  if (exception) console.error(exception);
}

function _logSuccess(message) {
  console.log(`${ANSI_START_GREEN}${ANSI_START_BOLD}Success: ${ANSI_RESET}${message}`);
}

function _getBunnyApiKey() {
  const bunnyAPIKey = process.env.BUNNY_API_KEY;
  if (!bunnyAPIKey) {
    console.error('Error: BUNNY_API_KEY is not set. Please run `source ./setEnv.sh` and try again.');
    process.exit(1);
  }
  return bunnyAPIKey;
}

async function _bunnyGetText(urlPath) {
  const bunnyAPIKey = _getBunnyApiKey();
  const options = {
    hostname: 'api.bunny.net', path:urlPath, method: 'GET',
    headers: {
      'Accept': 'application/json, text/plain',
      'AccessKey': bunnyAPIKey
    }
  };
  return await httpsRequest(options);
}

async function _bunnyGetJson(urlPath) {
  const jsonData = await _bunnyGetText(urlPath);
  return JSON.parse(jsonData);
}

async function _storageGetText(domainName, storageZoneName, password, storagePath) {
  storagePath = storagePath.startsWith('/') ? storagePath : '/' + storagePath;
  storagePath = `/${storageZoneName}${storagePath}`;
  const options = {
    hostname: domainName, path:storagePath, method: 'GET',
    headers: {
      'Accept': 'application/json, text/plain',
      'AccessKey': password
    }
  };
  const data = await httpsRequest(options);
  return data;
}

async function _fetchAppVersionInfo(domainName, storageZoneName, password, appName) {
  const stageIndexPath = appNameToStageIndexPath(appName);
  let htmlText;
  try {
    htmlText = await _storageGetText(domainName, storageZoneName, password, stageIndexPath);
  } catch(_ignored) { // Expected condition - index.html not created yet.
    return createEmptyVarsObject();
  }
  return parseStageIndex(htmlText); // This may throw for an invalid stage index file.
}

async function _writeAppVersionInfo(domainName, storageZoneName, password, appName, productionVersion, rollbackVersion, stageVersion) {
  const stageIndexText = createStageIndex(appName, productionVersion, rollbackVersion, stageVersion);
  const stageIndexPath = appNameToStageIndexPath(appName);
  await _storagePutText(domainName, storageZoneName, password, stageIndexPath, stageIndexText);
}

async function _storageGetJson(domainName, storageZoneName, password, storagePath) {
  const data = await _storageGetText(domainName, storageZoneName, password, storagePath);
  return JSON.parse(data);
}

async function _storageDelete(domainName, storageZoneName, password, storageFilepath) {
  storageFilepath = path.join('/', storageZoneName, storageFilepath);
  const options = {
    hostname: domainName, path:storageFilepath, method: 'DELETE',
    headers: { 'AccessKey': password }
  };
  await httpsRequest(options);
}

async function _storagePutLocalFile(domainName, storageZoneName, password, storageFilepath, localFilePath) {
  if (storageFilepath.endsWith('/')) throw new Error(`Cannot PUT to a directory: ${storageFilepath}`); // Write a file instead, and the directory will be implicitly created.
  storageFilepath = storageFilepath.startsWith('/') ? storageFilepath : '/' + storageFilepath;
  storageFilepath = `/${storageZoneName}${storageFilepath}`;
  const options = {
    hostname: domainName, path:storageFilepath, method: 'PUT',
    headers: {
      'AccessKey': password,
      'Content-Type': 'application/octet-stream'
    },
  };
  await httpsRequestWithBodyFromFile(options, localFilePath);
}

async function _storagePutText(domainName, storageZoneName, password, storageFilepath, text) {
  if (storageFilepath.endsWith('/')) throw new Error(`Cannot PUT to a directory: ${storageFilepath}`); // Write a file instead, and the directory will be implicitly created.
  storageFilepath = storageFilepath.startsWith('/') ? storageFilepath : '/' + storageFilepath;
  storageFilepath = `/${storageZoneName}${storageFilepath}`;
  const options = {
    hostname: domainName, path:storageFilepath, method: 'PUT',
    headers: {
      'AccessKey': password,
      'Content-Type': 'text/plain'
    },
  };
  await httpsRequestWithBodyFromText(options, text);
}

async function _getStorageZone(id) {
  return await _bunnyGetJson(`/storagezone/${id}`);
}

export async function _listStorageZones() {
  return await _bunnyGetJson('/storagezone');
}

async function _findStorageZoneId(name) {
  const storageZones = await _listStorageZones();
  const zone = storageZones.find(z => z.Name === name);
  return zone ? zone.Id : null;
}

function _isDirectoryResponse(response) {
  return response.startsWith('[');
}

// Returns an array of local filepaths, one for each file found at the localPath directory, recursing into subdirectories.
async function _findFilesAtPath(localPath) {
  const filepaths = [];
  async function _findFilesAtPathHelper(currentPath) {
    const dir = await opendir(currentPath);
    for await (const dirEntry of dir) {
      const fullPath = path.join(currentPath, dirEntry.name);
      if (dirEntry.isDirectory()) {
        await _findFilesAtPathHelper(fullPath);
      } else {
        filepaths.push(fullPath);
      }
    }
  }
  await _findFilesAtPathHelper(localPath);
  return filepaths;
}

async function _browseStoragePath(storagePath) {
  const { StorageHostname, ReadOnlyPassword, Name} = currentStorageZone;
  if (!storagePath.endsWith('/')) storagePath = `${storagePath}/`;
  return await _storageGetJson(StorageHostname, Name, ReadOnlyPassword, storagePath);
}

// Returns map of storage filepaths to their checksum values, looking recursively at storagePath.
async function _findFileChecksumsAtStoragePath(storagePath) {
  const map = {};
  async function _findFileChecksumsAtStoragePathHelper(recursedStoragePath) {
    const fileEntries = await _browseStoragePath(recursedStoragePath);
    for(let i = 0; i < fileEntries.length; ++i) {
      const { IsDirectory, Checksum, ObjectName } = fileEntries[i];
      const combinedPath = path.join(recursedStoragePath, ObjectName);
      if (IsDirectory) {
        await _findFileChecksumsAtStoragePathHelper(combinedPath);
      } else {
        map[combinedPath] = Checksum;
      }
    }
  }
  await _findFileChecksumsAtStoragePathHelper(storagePath);
  return map;
}

async function _calcLocalFileChecksum(localFilePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const fileStream = createReadStream(localFilePath);

    fileStream.on('data', (data) => hash.update(data));

    fileStream.on('end', () => {
      const checksum = hash.digest('hex').toUpperCase(); // Convert to uppercase to match Bunny.net's format
      resolve(checksum);
    });

    fileStream.on('error', (err) => reject(err));
  }).catch((err) => { throw err; });
}

async function _deleteFilesFromStorage(storageFilepaths, maxConcurrency) {
  const { StorageHostname, Name, Password } = currentStorageZone;
  const taskFunctions = storageFilepaths.map((storageFilepath) => {
    return async() => {
      console.log(`Deleting ${storageFilepath} from storage as it doesn't exist locally.`);
      await _storageDelete(StorageHostname, Name, Password, storageFilepath);
    };
  });
  return await _executeTasksWithMaxConcurrency(taskFunctions, maxConcurrency);
}

function _createSyncFilesSummaryMessage(stats) {
  function _nFiles(n) { return n === 1 ? '1 file' : `${n} files`};
  const { skippedCount, uploadedCount, deletedCount} = stats;
  let concatParts = [];
  if (uploadedCount) concatParts.push(`uploaded ${_nFiles(uploadedCount)}`);
  if (skippedCount) concatParts.push(`skipped ${_nFiles(skippedCount)} (no differences found)`);
  if (deletedCount) concatParts.push(`deleted ${_nFiles(deletedCount)} (not found in local files)`);
  let message = concatParts.join(', ') + '.';
  message = message[0].toUpperCase() + message.substring(1);
  return message;
}

async function _executeTasksWithMaxConcurrency(taskFunctionArray, maxConcurrency) {
  let remainingToCompleteCount = taskFunctionArray.length;
  const taskFunctions = [...taskFunctionArray];
  return new Promise((resolve, reject) => {
    function _startNextTask(taskFunction) {
      taskFunction().then(() => {
        if (--remainingToCompleteCount === 0) { resolve(); return; }
        if (taskFunctions.length) _startNextTask(taskFunctions.pop());
      }).catch((err) => reject(err)); 
    }
    
    // Start first batch of concurrent tasks.
    const firstBatchCount = Math.min(maxConcurrency, taskFunctionArray.length);
    for(let i = 0; i < firstBatchCount; ++i) { 
      const taskFunction = taskFunctions.pop();
      _startNextTask(taskFunction); 
    }
  }).catch((err) => { throw err; });
}

async function _uploadFilesToStorage(storageHostName, storageZoneName, password, storagePath, localPath, maxConcurrentUploads) {
  const localFilepaths = await _findFilesAtPath(localPath);
  const stats = { localFilesCount:localFilepaths.length, skippedCount:0, uploadedCount:0, deletedCount:0, storageOrphanFiles:[] };

  if (!stats.localFilesCount) throw new Error(`No files found at ${localPath}`);
  const storageFileChecksums = await _findFileChecksumsAtStoragePath(storagePath);

  const taskFunctions = localFilepaths.map(localFilepath => {
    const relativePath = path.relative(localPath, localFilepath);
    const uploadPath = path.join(storagePath, relativePath);

    return async() => {
      const localFileChecksum = await _calcLocalFileChecksum(localFilepath);
      const skipUpload = (localFileChecksum === storageFileChecksums[uploadPath]);
      delete storageFileChecksums[uploadPath];
      if (skipUpload) {
        ++stats.skippedCount;
        return;
      }
      console.log(`Uploading ${localFilepath} to ${uploadPath}.`);
      await _storagePutLocalFile(storageHostName, storageZoneName, password, uploadPath, localFilepath);

      ++stats.uploadedCount;
    }
  });

  await _executeTasksWithMaxConcurrency(taskFunctions, maxConcurrentUploads);

  stats.storageOrphanFiles = Object.keys(storageFileChecksums);
  return stats;
}

let currentStorageZone = null; // Use this from top-level APIs and pass it down to helper functions.

/* Top-level APIs

    Error-handling design:
    * useStorageZone() is a necessary call before any of the other storage-related APIs. It serves to
      test connection to the BunnyAPI and that the storage name and params used commonly across other
      APIs are correct.
    * No explicit Promise() handling in top level APIs. Any explicit Promise() handling should be  
      encapsulated in async helper functions.
    * Async helper functions rethrow `reject()` so that top-level callers only need to use `try...catch`.
      Top-level calls to async helper functions must use `await` to avoid missing these exceptions.
    * Top-level APIs responsible for checking prereqs so that helper functions don't need to.
    * Top-level APIs don't throw to their callers. They return non-null values for success, and null for failure.
    * Top-level APIs for writing operations summarize success/failure at end.
*/

export async function useStorageZone(name) {
  try {
    if (currentStorageZone && currentStorageZone.Name === name) return currentZoneInfo;
    const id = await _findStorageZoneId(name);
    if (!id) { throw new Error(`Storage zone ${name} not found`); }
    currentStorageZone = await _getStorageZone(id);
    console.log(`Using "${name}" storage zone after successful access via storage API.`)
    return currentStorageZone;
  } catch(err) {
    _logError(`Failed to access ${name} via storage API.`, err);
    return null;
  }
}

export async function fetchStorageFile(storagePath) {
  if (!currentStorageZone) { throw new Error('Call useStorageZone() to set a current storage zone.'); }
  const { StorageHostname, ReadOnlyPassword, Name} = currentStorageZone;
  return await _storageGetText(StorageHostname, Name, ReadOnlyPassword, storagePath);
}

export async function doesDirectoryExist(storagePath) {
  try {
    if (!currentStorageZone) { throw new Error('Call useStorageZone() to set a current storage zone.'); }
    if (!storagePath.endsWith('/')) storagePath = `${storagePath}/`;
    const { StorageHostname, ReadOnlyPassword, Name} = currentStorageZone;
    try {
      const response = await _storageGetText(StorageHostname, Name, ReadOnlyPassword, storagePath);
      return _isDirectoryResponse(response);
    } catch(_ignored) { // Because useStorage() was previously called, very likely the error is an expected failure.
      return false;
    }
  } catch(err) {
    _logError(`Failed to check "${storagePath}" directory.`, err);
    return null;
  }
}

export async function doesFileExist(storagePath) {
  try {
    if (!currentStorageZone) { throw new Error('Call useStorageZone() to set a current storage zone.'); }
    if (!storagePath.endsWith('/')) storagePath = `${storagePath}/`;
    const { StorageHostname, ReadOnlyPassword, Name} = currentStorageZone;
    try {
      const response = await _storageGetText(StorageHostname, Name, ReadOnlyPassword, storagePath);
      return !_isDirectoryResponse(response);
    } catch(_ignored) { // Because useStorage() was previously called, very likely the error is an expected failure.
      return false;
    }
  } catch(err) {
    _logError(`Failed to check "${storagePath}" file.`, err);
    return null;
  }
}

// Idempotent. This overwrites existing file or creates new file. Directories are created implicitly.
export async function uploadFileToStorage(storagePath, localFilePath) {
  try {
    if (!currentStorageZone) { throw new Error('Call useStorageZone() to set a current storage zone.'); }
    const { StorageHostname, Password, Name} = currentStorageZone;
    await _storagePutLocalFile(StorageHostname, Name, Password, storagePath, localFilePath);
    _logSuccess(`Uploaded file from '${localFilePath}' to ${storagePath}.`);
    return true;
  } catch(err) {
    _logError(`Failed to upload file from '${localFilePath}' to ${storagePath}.`, err);
    return null;
  }
}

// Idempotent. 
export async function uploadTextToStorage(storagePath, filename, text) {
  try {
    if (!currentStorageZone) { throw new Error('Call useStorageZone() to set a current storage zone.'); }
    const { StorageHostname, Password, Name} = currentStorageZone;
    const storageFilepath = path.join(storagePath, filename);
    await _storagePutText(StorageHostname, Name, Password, storageFilepath, text);
    _logSuccess(`Created '${filename}' and uploaded to ${storagePath}.`);
    return true;
  } catch(err) {
    _logError(`Failed to upload '${filename}' to ${storagePath}.`, err);
    return null;
  }
}

// Idempotent.
export async function writeAppVersion(appStoragePath, version) {
  try {
    if (!currentStorageZone) { throw new Error('Call useStorageZone() to set a current storage zone.'); }
    const { StorageHostname, Password, Name} = currentStorageZone;
    const storageFilepath = path.join(appStoragePath, 'version.txt');
    await _storagePutText(StorageHostname, Name, Password, storageFilepath, version);
    _logSuccess(`Wrote version ${version} to ${storageFilepath}.`);
    return true;
  } catch(err) {
    _logError(`Failed to write version ${version} to ${storageFilepath}.`, err);
    return null;
  }
}

export async function fetchAppVersion(appStoragePath) {
  try {
    if (!currentStorageZone) { throw new Error('Call useStorageZone() to set a current storage zone.'); }
    const { StorageHostname, Password, Name} = currentStorageZone;
    const storageFilepath = path.join(appStoragePath, 'version.txt');
    const version = await _storageGetText(StorageHostname, Name, Password, storageFilepath);
    _logSuccess(`Version ${version} currently deployed at ${appStoragePath}.`);
  } catch(err) {
    _logError(`Failed to fetch app version at '${appStoragePath}'.`, err);
    return null;
  }
}

// Idempotent. Uploads files found recursively at a localPath to storage, skipping uploads for files that already
// synched according to local/remote hash code comparison.
export async function uploadFilesToStorage(storagePath, localPath, maxConcurrentUploads=DEFAULT_MAX_CONCURRENT_REQUESTS) {
  try {
    if (!currentStorageZone) throw new Error('Call useStorageZone() to set a current storage zone.');
    if (!storagePath.endsWith('/')) storagePath = `${storagePath}/`;
    const { StorageHostname, Password, Name} = currentStorageZone;
    const stats = await _uploadFilesToStorage(StorageHostname, Name, Password, storagePath, localPath, maxConcurrentUploads);
    _logSuccess(_createSyncFilesSummaryMessage(stats));
    return stats;
  } catch(err) {
    _logError(`Failed to upload files from '${localPath}' to ${storagePath}.`, err);
    return null;
  }
}

// Idempotent. If it fails, then it should be reasonably performant to call this function again to retry/resume.
export async function syncFilesToStorage(storagePath, localPath, maxConcurrency=DEFAULT_MAX_CONCURRENT_REQUESTS) {
  try {
    if (!currentStorageZone) throw new Error('Call useStorageZone() to set a current storage zone.');
    if (!storagePath.endsWith('/')) storagePath = `${storagePath}/`;
    const { StorageHostname, Password, Name} = currentStorageZone;
    const stats = await _uploadFilesToStorage(StorageHostname, Name, Password, storagePath, localPath, maxConcurrency);
    if (stats.storageOrphanFiles.length) {
      await _deleteFilesFromStorage(stats.storageOrphanFiles, maxConcurrency);
      stats.deletedCount = stats.storageOrphanFiles.length;
    }
    _logSuccess(_createSyncFilesSummaryMessage(stats));
    return stats;
  } catch(err) {
    _logError(`Failed to sync files between from '${localPath}') to ${storagePath}.`, err);
    return null;
  }
}

// Idempotent. This writes the /_appName/index.html file to accomplish 2 things: correct version#s are inside of it,
// and it redirects to the last-deployed-to-stage version of the app. (Useful to be able to browse to '/_appName/' rather
// than '/_appName/aaaaaaa/' while testing staging.)
export async function updateAppStageVersion(appName, stageVersion) {
  try {
    if (!currentStorageZone) { throw new Error('Call useStorageZone() to set a current storage zone.'); }
    const { StorageHostname, ReadOnlyPassword, Password, Name} = currentStorageZone;
    const { productionVersion, rollbackVersion } = await _fetchAppVersionInfo(StorageHostname, Name, ReadOnlyPassword, appName);
    await _writeAppVersionInfo(StorageHostname, Name, Password, appName, productionVersion, rollbackVersion, stageVersion);
    _logSuccess(`Updated stage version of ${appName} to ${stageVersion}.`);
    return true;
  } catch(err) {
    _logError(`Failed to update stage version of ${appName}.`, err);
    return null;
  }
}