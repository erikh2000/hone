import { isLlmConnected, setSystemMessage } from "@/llm/llmUtil";
import { SYSTEM_MESSAGE } from "./prompt";
import { importFromPasteEvent } from "./import";
import { LOAD_URL } from "@/init/theUrls";
import { initBeforeUnload, deinitBeforeUnload } from "./beforeUnload";
import { ModelDeviceProblemsDialog, predictModelDeviceProblems } from "decent-portal";
import { WEBLLM_MODEL } from "@/llm/webLlmUtil";

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

export async function init(setAvailableSheets:Function, setModalDialog:Function, setLocation:Function, setModelDeviceProblems:Function) {
  setSystemMessage(SYSTEM_MESSAGE);
  
  if (pasteHandler) document.removeEventListener('paste', pasteHandler);
  pasteHandler = clipboardEvent => _handlePaste(clipboardEvent, setAvailableSheets, setModalDialog);
  document.addEventListener('paste', pasteHandler);

  initBeforeUnload();

  if (!isLlmConnected()) { // First arrival to screen with LLM not loaded.
    const problems = await predictModelDeviceProblems(WEBLLM_MODEL);
    if (problems) {
      setModalDialog(ModelDeviceProblemsDialog.name);
      setModelDeviceProblems(problems); // User can review problems and decide to continue loading or not.
    } else {
      setLocation(LOAD_URL); // Go to load screen and it will load the model.
    }
  }
}

export function deinit() {
  if (pasteHandler) {
    document.removeEventListener('paste', pasteHandler);
    pasteHandler = null;
  }
  deinitBeforeUnload();
}