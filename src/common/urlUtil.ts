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

// Disable the function from test coverage.
/* istanbul ignore next */
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