import { opendir, stat, mkdir } from 'fs/promises';
import { createHash } from 'crypto';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';

// Returns an array of local filepaths, one for each file found at the localPath directory, recursing into subdirectories.
export async function findFilesAtPath(localPath) {
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

export async function calcLocalFileChecksum(localFilePath) {
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

export async function doesDirectoryExist(dirPath) {
  try {
    const stats = await stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export async function createDirectoryAsNeeded(dirPath) {
  if (await doesDirectoryExist(dirPath)) return;
  await mkdir(dirPath, { recursive: true });
}

async function _put(localFilePath, data) {
  return new Promise((resolve, reject) => {
    const writeStream = createWriteStream(localFilePath);
    writeStream.write(data);
    writeStream.end();
    writeStream.on('finish', () => resolve());
    writeStream.on('error', (err) => reject(err));
  }).catch((err) => { throw err; });
}

export async function putText(localFilePath, text) {
  return _put(localFilePath, text);
}

// bytes is Uint8Array.
export async function putBytes(localFilePath, bytes) {
  return _put(localFilePath, bytes);
}