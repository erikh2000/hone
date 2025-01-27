let theIsDirty = false;

function _onBeforeUnload(event:BeforeUnloadEvent) {
  if (!theIsDirty) return;
  event.preventDefault();
  event.returnValue = ''; // Deprecated, but maybe useful for some browsers.
}

export function setDirty(isDirty:boolean) {
  theIsDirty = isDirty;
}

export function initBeforeUnload() {
  theIsDirty = false;
  window.addEventListener('beforeunload', _onBeforeUnload);
}

export function deinitBeforeUnload() {
  window.removeEventListener('beforeunload', _onBeforeUnload);
}