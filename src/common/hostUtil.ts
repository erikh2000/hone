
export async function isHostListening(domain:string, portNo:number, timeout:number = 100) {
    const url = `http://${domain}:${portNo}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
        await fetch(url, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        return true; // A non-200 status code doesn't matter. Any response means the host is listening. 
    } catch (error:any) {
        // A timeout is an expected condition and not worth logging.
        if (error.name !== 'AbortError') console.warn('Fetch request failed:', error);
        return false;
    }
}