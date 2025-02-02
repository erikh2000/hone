/* For simpler repo licensing and font caching across multiple apps, I deploy 
   all the fonts used by my web apps to https://decentapps.net/fonts. However, it's 
   useful when building standalone docker images and running from local dev, to
   fetch these files to the local environment. */

import * as https from 'https';

import { logOverallSuccess, logError } from './util/colorfulMessageUtil.js';
import { putBytes, createDirectoryAsNeeded } from './util/localFileUtil.js';

const FETCH_HOSTNAME = 'decentapps.net';
const FETCH_PREFIX = `https://${FETCH_HOSTNAME}/fonts/`;
const FONTS_TO_COPY = ['hobby-of-night', 'jellee'];
const DEST_PREFIX = './public/fonts/';

function _parseHostName(url) {
   const urlParts = url.split('/');
   return urlParts[2];
}

function _parsePath(url) {
   const urlParts = url.split('/');
   return '/' + urlParts.slice(3).join('/');
}

function _parseFilename(url) {
   const urlParts = url.split('/');
   return urlParts[urlParts.length - 1];
}
   
async function _httpsRequestText(options) {
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

// Return a Uint8Array with all bytes.
async function _httpsRequestBytes(options) {
   return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
         let chunks = [];
         let totalLength = 0;
         
         res.on('data', (chunk) => {
            chunks.push(chunk);
            totalLength += chunk.length;
         });
         
         res.on('end', () => {
            const data = Buffer.concat(chunks, totalLength);
            const uint8Array = new Uint8Array(data);
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
               resolve(uint8Array);
            } else {
               reject(new Error(`Request failed. Status code: ${res.statusCode}. Response: ${uint8Array}`));
            }
         });
      });
      
      req.on('error', (err) => reject(err));
      req.end();
   }).catch((err) => { throw err; });
}

// Fetches a file and writes it to a local destination filepath.
async function _downloadFile(url, destPath) {
   console.log(`Downloading ${url} to ${destPath}...`);
   const hostname = _parseHostName(url);
   const path = _parsePath(url);
   const options = { hostname, path, port: 443, method: 'GET' };
   const bytes = await _httpsRequestBytes(options);
   const filename = _parseFilename(url);
   const destFilepath = `${destPath}${filename}`;
   await putBytes(destFilepath, bytes);
}

// Fetches a file and returns text of it.
async function _fetchCssText(url) {
   console.log(`Fetching CSS from ${url}...`);
   const hostname = _parseHostName(url);
   const path = _parsePath(url);
   const options = { hostname, path, port: 443, method: 'GET' };
   const text = await _httpsRequestText(options);
   return text;
}

/* Okay to assume CSS files will all be valid and very close to example format below. Anything inside of url() is a font filename.
   @font-face {
      font-family: 'gidole';
      src: url('gidolinya-regular-webfont.woff2') format('woff2'),
            url('gidolinya-regular-webfont.woff') format('woff');
      font-weight: normal;
      font-style: normal;
   }
*/
function _parseFontFilenamesFromCss(cssText) {
   const filenames = [];
   let pos = 0;
   while(pos < cssText.length) {
      let startUrlPos = cssText.indexOf(`url('`, pos);
      if (startUrlPos === -1) break;
      startUrlPos += 5;
      const endUrlPos = cssText.indexOf(`')`, startUrlPos);
      if (endUrlPos === -1) break;
      filenames.push(cssText.substring(startUrlPos, endUrlPos));
      pos = endUrlPos + 1;
   }
   return filenames;
}



async function _fetchFont(fontName) {
   const destPath = `${DEST_PREFIX}${fontName}/`;
   await createDirectoryAsNeeded(destPath);
   await _downloadFile(`${FETCH_PREFIX}${fontName}/LICENSE`, destPath);
   const cssUrl = `${FETCH_PREFIX}${fontName}/${fontName}.css`;
   await _downloadFile(cssUrl, destPath);
   const cssText = await _fetchCssText(cssUrl);
   const fontFilenames = _parseFontFilenamesFromCss(cssText);
   for(let i = 0; i < fontFilenames.length; ++i) {
      await _downloadFile(`${FETCH_PREFIX}${fontName}/${fontFilenames[i]}`, destPath);
   }
}

async function _main() {
   try {
      for(let i = 0; i < FONTS_TO_COPY.length; ++i) {
         await _fetchFont(FONTS_TO_COPY[i]);
      }
      logOverallSuccess('Fetched all fonts.');
   } catch(err) {
      logError('Failed to fetch fonts.', err);
   }
}

_main();