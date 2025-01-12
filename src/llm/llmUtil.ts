import LLMConnection from "./types/LLMConnection";
import LLMConnectionState from "./types/LLMConnectionState";
import LLMConnectionType from "./types/LLMConnectionType";
import LLMMessages from "./types/LLMMessages";
import StatusUpdateCallback from "./types/StatusUpdateCallback";
import { connectToWebLLM, generateWebLLM } from "./webLlmUtil";
import { updateStatsForPrompt } from "./llmStatsUtil";
import { getCachedPromptResponse, setCachedPromptResponse } from "./promptCache";

let theConnection:LLMConnection = {
  state:LLMConnectionState.UNINITIALIZED,
  webLLMEngine:null,
  serverUrl:null,
  connectionType:LLMConnectionType.NONE
}

let messages:LLMMessages = {
  chatHistory: [],
  maxChatHistorySize: 100,
  systemMessage: null
};

let savedMessages:LLMMessages|null = null;

export function isInitialized():boolean { return theConnection.state === LLMConnectionState.READY || theConnection.state === LLMConnectionState.GENERATING; }

export async function init(onStatusUpdate:StatusUpdateCallback) {
  if (isInitialized()) return;
  theConnection.state = LLMConnectionState.INITIALIZING;
  const connectionSuccess = await connectToWebLLM(theConnection, onStatusUpdate);
  if (!connectionSuccess) { 
    theConnection.webLLMEngine = null;
    theConnection.serverUrl = null;
    theConnection.connectionType = LLMConnectionType.NONE;
    theConnection.state = LLMConnectionState.INIT_FAILED;
    throw new Error('Failed to connect to LLM.');
  }
  theConnection.state = LLMConnectionState.READY;
}

export function isLlmConnected():boolean {
  return theConnection.state === LLMConnectionState.READY || theConnection.state === LLMConnectionState.GENERATING;
}

export function setSystemMessage(message:string|null) {
  messages.systemMessage = message;
}

export function setChatHistorySize(size:number) {
  messages.maxChatHistorySize = size;
}

export function saveChatConfiguration() {
  savedMessages = {...messages};
}

export function restoreChatConfiguration() {
  if (!savedMessages) throw Error('No saved configuration.');
  messages = {...savedMessages};
}

export function clearChatHistory() {
  messages.chatHistory = [];
}

export async function generate(prompt:string, onStatusUpdate:StatusUpdateCallback):Promise<string> {
  const cachedResponse = getCachedPromptResponse(prompt);
  if (cachedResponse) {
    onStatusUpdate(cachedResponse, 100);
    return cachedResponse;
  }

  if (!isInitialized()) throw Error('LLM connection is not initialized.');
  if (theConnection.state !== LLMConnectionState.READY) throw Error('LLM is not in ready state.');
  theConnection.state = LLMConnectionState.GENERATING;
  let promptStartTime = Date.now();
  let message = '';
  switch(theConnection.connectionType) {
    case LLMConnectionType.WEBLLM: message = await generateWebLLM(theConnection, messages, prompt, onStatusUpdate); break;
    default: throw Error('Unexpected');
  }
  setCachedPromptResponse(prompt, message);
  updateStatsForPrompt(Date.now() - promptStartTime);
  theConnection.state = LLMConnectionState.READY;
  return message;
}