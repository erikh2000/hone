import { baseUrl } from "@/common/urlUtil";

// Don't reference the DOM. Avoid any work that could instead be done in the loading screen or someplace else
export async function initApp() {
  if ('serviceWorker' in navigator) {
    await navigator.serviceWorker.register(baseUrl('/serviceWorker.js'));
  }
}