import { bunnyPost } from './bunnyHttpUtil.js';
import { normalizeAppUrl } from './pathUtil.js';

async function _purgePattern(patternUrl) {
  const urlPath = `/purge?url=${encodeURIComponent(patternUrl)}&async=false`;
  await bunnyPost(urlPath);
}

export async function purgeFile(purgeFileUrl) {
  await _purgePattern(purgeFileUrl);
}

// /app, /app/ and /app/index.html are cached separately in the pull zone. This function purges all of them.
// pullUrl can be in any of the three formats.
export async function purgeLandingUrl(purgeLandingUrl) {
  const appUrl = normalizeAppUrl(purgeLandingUrl);
  await _purgePattern(appUrl);
  await _purgePattern(appUrl + 'index.html');
  await _purgePattern(appUrl.substring(0, appUrl.length - 1));
}

export async function purgeApp(purgeAppUrl) {
  const appUrl = `${normalizeAppUrl(purgeAppUrl)}*`; //E.g. https://example.com/app/*
  await _purgePattern(appUrl);
}