import { cacheBustUrl, normalizeUrl } from "./urlUtil";

async function _send(url:string, method:string, timeout:number):Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        await fetch(url, { method, signal: controller.signal });
        clearTimeout(timeoutId);
        return true; // A non-200 status code doesn't matter. Any response means the host is listening. 
    } catch (error:any) {
        // A timeout is an expected condition and not worth logging.
        if (error.name !== 'AbortError') console.warn('Fetch request failed:', error);
        return false;
    }
}

export async function isHostListeningAtUrl(url:string, timeout:number = 1000) {
    url = normalizeUrl(url);
    url = cacheBustUrl(url);
    // Prefer to just query with HEAD, but some hosts don't respond to HEAD so use GET as a fallback.
    return await _send(url, 'HEAD', timeout) || await _send(url, 'GET', timeout);
}

export async function isHostListening(domain:string, portNo:number, timeout:number = 1000) {
    const url = cacheBustUrl(`http://${domain}:${portNo}`);
    return await isHostListeningAtUrl(url, timeout);
}