import { isLlmConnected, setSystemMessage } from "@/llm/llmUtil";
import { SYSTEM_MESSAGE } from "./prompt";
import { importFromPasteEvent } from "./import";
import { isServingLocally } from "@/developer/devEnvUtil";
import LLMDevPauseDialog from "@/homeScreen/dialogs/LLMDevPauseDialog";
import { LOAD_URL } from "@/common/urlUtil";

type PasteHandlerFunction = (event:ClipboardEvent) => void;

let pasteHandler:PasteHandlerFunction|null = null;

function _handlePaste(clipboardEvent:ClipboardEvent, setAvailableSheets:Function, setModalDialog:Function) {
  const target = clipboardEvent.target as HTMLElement|null;

  if (target) {
    // If an editable DOM element is focused, I just want the browser's default handling of the paste.
    const targetName = target.tagName;
    if (targetName === 'INPUT' || targetName === 'TEXTAREA' || target.isContentEditable) return;
  }

  // Try to import a sheet from the clipboard.
  clipboardEvent.preventDefault();
  importFromPasteEvent(clipboardEvent, setAvailableSheets, setModalDialog);
}

export async function init(setAvailableSheets:Function, setModalDialog:Function, setLocation:Function) {
  setSystemMessage(SYSTEM_MESSAGE);
  
  if (pasteHandler) document.removeEventListener('paste', pasteHandler);
  pasteHandler = clipboardEvent => _handlePaste(clipboardEvent, setAvailableSheets, setModalDialog);
  document.addEventListener('paste', pasteHandler);

  if (!isLlmConnected()) {
    if (isServingLocally()) {
      setModalDialog(LLMDevPauseDialog.name); // Probably a hot reload on a dev server - ask user if should load LLM.
      return;
    }
    setLocation(LOAD_URL); // First arrival to screen with LLM not loaded. Go load it and come back.
  }
}

export function deinit() {
  if (pasteHandler) {
    document.removeEventListener('paste', pasteHandler);
    pasteHandler = null;
  }
}