let theBasePath:string|null = null;

/*  Some assumptions:
    * First path segment is always the app name
    * If the app name is prefixed with an underscore (staged app), the base will include a version hash in the second path segment.
    * Generally, any valid-but-weird URLs will just give garbage results, and that can be a debug error. */
export function parseBasePathFromUriPath(path:string) {
  const pathSegments = path.split('/').filter(segment => segment !== '');
  if (pathSegments.length < 1) return '/';

  const appName = pathSegments[0];
  const isStagedApp = appName.startsWith('_') && pathSegments.length > 1;
  return isStagedApp ? `/${appName}/${pathSegments[1]}/` : `/${appName}/`;
}

// From https://127.0.0.1:8080/path/to/file to https://127.0.1:8080/ and variants. Basically, just the scheme, domain, and port.
export function parseDomainUrlFromUrl(url:string) {
  const urlObject = new URL(url);
  return `${urlObject.protocol}//${urlObject.hostname}${urlObject.port ? ':' + urlObject.port : ''}/`;
}

// Add missing scheme and hostname as needed. Retain full path.
export function normalizeUrl(url:string):string {
  const urlObject = new URL(url, window.location.href);
  return urlObject.href.toString();
}

// Add a cach-busting query string to the URL, which may or may not already have a query string.
export function cacheBustUrl(url:string):string {
  const urlObject = new URL(url, window.location.href);
  const params = new URLSearchParams(urlObject.search);
  params.set('v', Date.now().toString());
  urlObject.search = params.toString();
  return urlObject.href.toString();
}

/* istanbul ignore next */ // Web-DOM-specific code that is not useful to test.
function _getBasePath() {
  if (!theBasePath) { theBasePath = parseBasePathFromUriPath(window.location.pathname); }
  return theBasePath;
}

export function baseUrl(path: string) {
  if (path.startsWith('/')) { path = path.slice(1); }
  const basePath = _getBasePath();
  return `${basePath}${path}`;
}

export const HOME_URL = baseUrl('/');
export const LOAD_URL = baseUrl('/load');
export const TEST_URL = baseUrl('/test');