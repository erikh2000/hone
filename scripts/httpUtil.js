import * as https from 'https';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';

export async function httpsRequest(options) {
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

export async function httpsRequestWithBodyFromFile(options, filePath) {
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

export async function httpsRequestWithBodyFromText(options, text) {
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