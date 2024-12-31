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

function _doesPromptTemplateContainFields(promptTemplate:string):boolean {
  const leftBraceI = promptTemplate.indexOf('{');
  const rightBraceI = promptTemplate.indexOf('}', leftBraceI+1);
  return (leftBraceI !== -1 && rightBraceI !== -1);
}

const MAX_FIELDNAME_DISPLAY_LENGTH = 15;

function _truncateText(text:string, maxLength:number):string {
  return text.length <= maxLength ? text : text.substring(0, maxLength-3) + '...';
}

function _findMalformedField(promptTemplate:string):string|null {
  let leftBraceI = promptTemplate.indexOf('{');;
  while(leftBraceI !== -1) {
    const rightBraceI = promptTemplate.indexOf('}', leftBraceI+1);
    if (rightBraceI === -1) return _truncateText(promptTemplate.substring(leftBraceI), MAX_FIELDNAME_DISPLAY_LENGTH);
    const nextLeftBraceI = promptTemplate.indexOf('{', leftBraceI+1);
    if (nextLeftBraceI !== -1 && nextLeftBraceI < rightBraceI) {
      return _truncateText(promptTemplate.substring(leftBraceI, nextLeftBraceI+1), MAX_FIELDNAME_DISPLAY_LENGTH);
    }
    leftBraceI = nextLeftBraceI;
  }
  return null;
}

// Function assumes no malformed fields are in the prompt template.
function _findMissingField(promptTemplate:string, columnNames:string[]):string|null {
  let leftBraceI = promptTemplate.indexOf('{');;
  while(leftBraceI !== -1) {
    const rightBraceI = promptTemplate.indexOf('}', leftBraceI+1);
    const fieldName = promptTemplate.substring(leftBraceI+1, rightBraceI);  
    if (!columnNames.includes(fieldName)) return _truncateText(fieldName, MAX_FIELDNAME_DISPLAY_LENGTH);
    leftBraceI = promptTemplate.indexOf('{', rightBraceI+1);
  }
  return null;
}

export function isPromptTemplateReady(promptTemplate:string, columnNames:string[]):boolean {
  if (promptTemplate === '') return false;
  if (!_doesPromptTemplateContainFields(promptTemplate)) return false;
  const malformedField = _findMalformedField(promptTemplate);
  if (malformedField) return false;
  const missingField = _findMissingField(promptTemplate, columnNames);
  if (missingField) return false;
  return true;
}

export function getComment(promptTemplate:string, columnNames:string[], lastTestOutput:string):string {
  if (promptTemplate === '') return "Write a prompt to execute against each row of the sheet.";
  if (!_doesPromptTemplateContainFields(promptTemplate)) return "The prompt template doesn't contain any fields yet.";
  const malformedField = _findMalformedField(promptTemplate);
  if (malformedField) return `The prompt template contains a malformed field around "${malformedField}".`;
  const missingField = _findMissingField(promptTemplate, columnNames);
  if (missingField) return `The prompt template references a "${missingField}" field that doesn't exist in the sheet.`;
  if (lastTestOutput !== '') return "Keep testing the prompt against different rows, and execute it against all rows when you're ready.";
  return 'You can test this prompt on one row to see how it does.';
}