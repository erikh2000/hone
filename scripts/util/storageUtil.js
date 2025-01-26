import path from 'path';

import { executeTasksWithMaxConcurrency } from './concurrentUtil.js';
import { bunnyGetJson, storagePutLocalFile, storageGetJson, storageDelete } from './bunnyHttpUtil.js';
import { calcLocalFileChecksum, findFilesAtPath } from './localFileUtil.js';
import { logError, logSuccess } from './colorfulMessageUtil.js';

let currentStorageZone = null;

/* Bunny's docs on storage API limits - https://docs.bunny.net/reference/edge-storage-api-limits
   If there's only one ongoing upload to my storage zone, a higher number, e.g. 50 should work.
   Erring on the side of caution in case I start a couple of deployments simultaneously. */
const DEFAULT_MAX_CONCURRENT_REQUESTS = 20;

async function _listStorageZones() {
  return await bunnyGetJson('/storagezone');
}

async function _findStorageZoneId(name) {
  const storageZones = await _listStorageZones();
  const zone = storageZones.find(z => z.Name === name);
  return zone ? zone.Id : null;
}

async function _getStorageZone(id) {
  return await bunnyGetJson(`/storagezone/${id}`);
}

async function _uploadFilesToStorage(storageHostName, storageZoneName, password, storagePath, localPath, maxConcurrentUploads) {
  const localFilepaths = await findFilesAtPath(localPath);
  const stats = { localFilesCount:localFilepaths.length, skippedCount:0, uploadedCount:0, deletedCount:0, storageOrphanFiles:[] };

  if (!stats.localFilesCount) throw new Error(`No files found at ${localPath}`);
  const storageFileChecksums = await _findFileChecksumsAtStoragePath(storagePath);

  const taskFunctions = localFilepaths.map(localFilepath => {
    const relativePath = path.relative(localPath, localFilepath);
    const uploadPath = path.join(storagePath, relativePath);

    return async() => {
      const localFileChecksum = await calcLocalFileChecksum(localFilepath);
      const skipUpload = (localFileChecksum === storageFileChecksums[uploadPath]);
      delete storageFileChecksums[uploadPath];
      if (skipUpload) {
        ++stats.skippedCount;
        return;
      }
      console.log(`Uploading ${localFilepath} to ${uploadPath}.`);
      await storagePutLocalFile(storageHostName, storageZoneName, password, uploadPath, localFilepath);

      ++stats.uploadedCount;
    }
  });

  await executeTasksWithMaxConcurrency(taskFunctions, maxConcurrentUploads);

  stats.storageOrphanFiles = Object.keys(storageFileChecksums);
  return stats;
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
  return `Local to storage synchronization complete. ${message}`;
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

async function _browseStoragePath(storagePath) {
  const { StorageHostname, ReadOnlyPassword, Name} = currentStorageZone;
  if (!storagePath.endsWith('/')) storagePath = `${storagePath}/`;
  return await storageGetJson(StorageHostname, Name, ReadOnlyPassword, storagePath);
}

async function _deleteFilesFromStorage(storageFilepaths, maxConcurrency) {
  const { StorageHostname, Name, Password } = currentStorageZone;
  const taskFunctions = storageFilepaths.map((storageFilepath) => {
    return async() => {
      console.log(`Deleting ${storageFilepath} from storage as it doesn't exist locally.`);
      await storageDelete(StorageHostname, Name, Password, storageFilepath);
    };
  });
  return await executeTasksWithMaxConcurrency(taskFunctions, maxConcurrency);
}

/* 
  Exports 
*/

export function getCurrentStorageZone() {
  if (!currentStorageZone) throw Error('Call useStorageZone() to a set a current storage zone.');
  return currentStorageZone;
}

// Idempotent.
export async function useStorageZoneSubtask(storageZoneName) {
  try {
    if (currentStorageZone && currentStorageZone.Name === storageZoneName) return currentZoneInfo;
    const id = await _findStorageZoneId(storageZoneName);
    if (!id) { throw new Error(`Storage zone ${storageZoneName} not found`); }
    currentStorageZone = await _getStorageZone(id);
    console.log(`Using "${storageZoneName}" storage zone after successful access via storage API.`)
    return currentStorageZone;
  } catch(err) {
    logError(`Failed to access ${storageZoneName} via storage API.`, err);
    return null;
  }
}

// Idempotent. If it fails, then it should be reasonably performant to call this function again to retry/resume.
export async function syncFilesToStorageSubtask(storagePath, localPath, maxConcurrency=DEFAULT_MAX_CONCURRENT_REQUESTS) {
  try {
    if (!currentStorageZone) throw new Error('Call useStorageZone() to set a current storage zone.');
    if (!storagePath.endsWith('/')) storagePath = `${storagePath}/`;
    const { StorageHostname:storageHostName, Password:password, Name:storageZoneName} = currentStorageZone;
    const stats = await _uploadFilesToStorage(storageHostName, storageZoneName, password, storagePath, localPath, maxConcurrency);
    if (stats.storageOrphanFiles.length) {
      await _deleteFilesFromStorage(stats.storageOrphanFiles, maxConcurrency);
      stats.deletedCount = stats.storageOrphanFiles.length;
    }
    logSuccess(_createSyncFilesSummaryMessage(stats));
    return stats;
  } catch(err) {
    logError(`Failed to sync files between from '${localPath}') to ${storagePath}.`, err);
    return null;
  }
}