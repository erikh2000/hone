import { baseUrl } from "@/common/urlUtil";

async function _registerServiceWorker() {
  try {
    if ('serviceWorker' in navigator) await navigator.serviceWorker.register(baseUrl('/serviceWorker.js'));
  } catch(err) {
    console.warn('Service worker registration failed:', err);
  }
}

// Don't reference the DOM. Avoid any work that could instead be done in the loading screen or someplace else
export async function initApp() {
    _registerServiceWorker();
}