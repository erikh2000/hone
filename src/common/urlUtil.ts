export const HOME_URL = baseUrl('/');
export const LOAD_URL = baseUrl('/load');
export const TEST_URL = baseUrl('/test');

export function baseUrl(path: string) {
  if (path.startsWith('/')) { path = path.slice(1); }
  const baseUrl = import.meta.env.VITE_BASE_URL || '/';
  return `${baseUrl}${path}`;
}