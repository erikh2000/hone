/*
  HTTP request functions for common forms of requests used for BunnyCDN and Bunny Storage. Not coupled to specific Bunny APIs.
*/
import * as https from 'https';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';

async function _httpsRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`Request failed. Status code: ${res.statusCode}. Response: ${data}`));
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.end();
  }).catch((err) => { throw(err); });
}

async function _httpsRequestWithBodyFromFile(options, filePath) {
  const fileStats = await stat(filePath);
  return new Promise((resolve, reject) => {
    // Write HTTP request headers, wait for the request body to be piped, and close the connection.
    options.headers['Content-Length'] = fileStats.size;
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, body: responseData });
        } else {
          reject(new Error(`Request failed with status code: ${res.statusCode}. Response: ${responseData}`));
        }
      });
    });
    req.on('error', (err) => reject(err));

    // Pipe the file stream to the request, writing it after HTTP headers are sent.
    const inputReadStream = createReadStream(filePath);
    inputReadStream.pipe(req);
    inputReadStream.on('end', () => req.end());
    inputReadStream.on('error', (err) => { req.destroy(); reject(err); });
  }).catch((err) => { throw err; });
}

async function _httpsRequestWithBodyFromText(options, text) {
  return new Promise((resolve, reject) => {
    // Write HTTP request headers, wait for the request body to be written, and close the connection.
    options.headers['Content-Length'] = Buffer.byteLength(text);
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, body: responseData });
        } else {
          reject(new Error(`Request failed with status code: ${res.statusCode}. Response: ${responseData}`));
        }
      });
    });
    req.on('error', (err) => reject(err));

    // Write text to body of request.
    req.write(text);
    req.end();
  }).catch((err) => { throw err; });
}


function _getBunnyApiKey() {
  const bunnyAPIKey = process.env.BUNNY_API_KEY;
  if (!bunnyAPIKey) {
    console.error('Error: BUNNY_API_KEY is not set. Please run `source ./setEnv.sh` and try again.');
    process.exit(1);
  }
  return bunnyAPIKey;
}

export async function bunnyGetText(urlPath) {
  const bunnyAPIKey = _getBunnyApiKey();
  const options = {
    hostname: 'api.bunny.net', path:urlPath, method: 'GET',
    headers: {
      'Accept': 'application/json, text/plain',
      'AccessKey': bunnyAPIKey
    }
  };
  return await _httpsRequest(options);
}

export async function bunnyGetJson(urlPath) {
  const jsonData = await bunnyGetText(urlPath);
  return JSON.parse(jsonData);
}

export async function bunnyPost(urlPath) {
  const bunnyAPIKey = _getBunnyApiKey();
  const options = {
    hostname: 'api.bunny.net', path:urlPath, method: 'POST',
    headers: {
      'Accept': 'application/json, text/plain',
      'AccessKey': bunnyAPIKey
    }
  };
  return await _httpsRequest(options);
}

export async function bunnyPostJson(urlPath, object) {
  const bunnyAPIKey = _getBunnyApiKey();
  const jsonText = JSON.stringify(object);
  const options = {
    hostname: 'api.bunny.net', path:urlPath, method: 'POST',
    headers: {
      'Accept': 'application/json, text/plain',
      'Content-Type': 'application/json',
      'AccessKey': bunnyAPIKey
    }
  };
  return await _httpsRequestWithBodyFromText(options, jsonText);
}

export async function storageGetText(domainName, storageZoneName, password, storagePath) {
  storagePath = storagePath.startsWith('/') ? storagePath : '/' + storagePath;
  storagePath = `/${storageZoneName}${storagePath}`;
  const options = {
    hostname: domainName, path:storagePath, method: 'GET',
    headers: {
      'Accept': 'application/json, text/plain',
      'AccessKey': password
    }
  };
  const data = await _httpsRequest(options);
  return data;
}

export async function storageGetJson(domainName, storageZoneName, password, storagePath) {
  const data = await storageGetText(domainName, storageZoneName, password, storagePath);
  return JSON.parse(data);
}

export async function storageDelete(domainName, storageZoneName, password, storageFilepath) {
  storageFilepath = path.join('/', storageZoneName, storageFilepath);
  const options = {
    hostname: domainName, path:storageFilepath, method: 'DELETE',
    headers: { 'AccessKey': password }
  };
  await _httpsRequest(options);
}

export async function storagePutLocalFile(domainName, storageZoneName, password, storageFilepath, localFilePath) {
  if (storageFilepath.endsWith('/')) throw new Error(`Cannot PUT to a directory: ${storageFilepath}`); // Write a file instead, and the directory will be implicitly created.
  storageFilepath = storageFilepath.startsWith('/') ? storageFilepath : '/' + storageFilepath;
  storageFilepath = `/${storageZoneName}${storageFilepath}`;
  const options = {
    hostname: domainName, path:storageFilepath, method: 'PUT',
    headers: {
      'AccessKey': password,
      'Content-Type': 'application/octet-stream'
    }
  };
  await _httpsRequestWithBodyFromFile(options, localFilePath);
}

export async function storagePutText(domainName, storageZoneName, password, storageFilepath, text) {
  if (storageFilepath.endsWith('/')) throw new Error(`Cannot PUT to a directory: ${storageFilepath}`); // Write a file instead, and the directory will be implicitly created.
  storageFilepath = storageFilepath.startsWith('/') ? storageFilepath : '/' + storageFilepath;
  storageFilepath = `/${storageZoneName}${storageFilepath}`;
  const options = {
    hostname: domainName, path:storageFilepath, method: 'PUT',
    headers: {
      'AccessKey': password,
      'Content-Type': 'text/plain'
    }
  };
  await _httpsRequestWithBodyFromText(options, text);
}