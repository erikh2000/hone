import { parseSimpleResponse, SIMPLE_RESPONSE_SUPPORTED_TYPES } from "@/common/sloppyJsonUtil";
import { errorToast } from "@/components/toasts/toastUtil";
import { clearChatHistory, generate, isLlmConnected } from "@/llm/llmUtil";

export const SYSTEM_MESSAGE = "Output your answer to the following question solely in a JSON format like: {\"r\":\"your answer\"}. You are generating data, not a conversation. No other output should be provided.";

export const GENERATING = '...';

let _isGenerating = false;

export async function promptForSimpleResponse(prompt:string, setResponseText:Function):Promise<SIMPLE_RESPONSE_SUPPORTED_TYPES> {
  if (_isGenerating) { console.warn('Tried to call promptForSimpleResponse() while generating. Nonfatal error.'); return null;} // If only happening occasionally, it's just a benign race condition. User might have to click a button one more time.
  _isGenerating = true;
  clearChatHistory();
  setResponseText(GENERATING);
  try {
    if (!isLlmConnected()) { errorToast('LLM is not connected. This happens in dev environments with hot reload. You can refresh the page to load the LLM.'); return null; }
    const finalResponse = await generate(prompt, (status:string) => setResponseText(`${parseSimpleResponse(status)}...`));
    const simpleResponse = '' + parseSimpleResponse(finalResponse);
    setResponseText(simpleResponse);
    return simpleResponse;
  } catch(e) {
    console.error('Error while generating response.', e);
    errorToast('Error while generating response. If it persists, try reloading the page.');
    setResponseText(null);
    return '';
  } finally {
    _isGenerating = false;
  }
}

// For React components that call this in rendering function, consider that some prop/state change must happen before the component will re-render. The
// setResponseText() calls in promptForSimpleResponse() will probably generating rendering calls as needed.
export function isGenerating():boolean { return _isGenerating; }

function _isInsertionPosAtLineStart(insertionPos:number, promptTemplate:string):boolean {
  return insertionPos === 0 || promptTemplate[insertionPos - 1] === '\n';
}

export function insertFieldNameIntoPromptTemplate(fieldName:string, textAreaElement:HTMLTextAreaElement, promptTemplate:string, setPromptTemplate:Function) {
  let insertionText = `{${fieldName}}`;
  const insertionPos = textAreaElement.selectionStart;
  const insertionEnd = textAreaElement.selectionEnd;
  if (_isInsertionPosAtLineStart(insertionPos, promptTemplate)) insertionText = `${fieldName}:${insertionText}\n`;
  const nextPromptTemplate = promptTemplate.slice(0, insertionPos) + insertionText + promptTemplate.slice(insertionEnd);
  setPromptTemplate(nextPromptTemplate);
  textAreaElement.focus();
  textAreaElement.selectionStart = textAreaElement.selectionEnd = insertionPos + insertionText.length;
}