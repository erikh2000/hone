import LLMConnection from "./types/LLMConnection";
import LLMConnectionState from "./types/LLMConnectionState";
import LLMConnectionType from "./types/LLMConnectionType";
import LLMMessages from "./types/LLMMessages";
import StatusUpdateCallback from "./types/StatusUpdateCallback";
import { connectToWebLLM, generateWebLLM, WEBLLM_MODEL } from "./webLlmUtil";
import { updateStatsForPrompt } from "./llmStatsUtil";
import { getCachedPromptResponse, setCachedPromptResponse } from "./promptCache";
import { isModelCached, setModelCached } from "@/persistence/timePredictions";
import { predictTime, storeActualTime, initialize as initializeTimePredictions, setDefault } from "@/timePredictions/timePredictionUtil";
import { connectToCustomLLM, generateCustomLLM } from "./customLlmUtil";

let theConnection:LLMConnection = {
  state:LLMConnectionState.UNINITIALIZED,
  webLLMEngine:null,
  serverUrl:null,
  customLLMConfig:null,
  connectionType:LLMConnectionType.NONE
}

let messages:LLMMessages = {
  chatHistory: [],
  maxChatHistorySize: 100,
  systemMessage: null
};

let savedMessages:LLMMessages|null = null;

// There is a circular dependency to figure out later if you want to support multiple LLM engines.
// 1. init() is currently both determining the LLM engine and starting the LLM load. The model is tied to the LLM engine.
// 2. but I want to predict the load time before I start loading the LLM.
// Rather than create abstraction to deal with it now, I'd prefer to roll in some other changes in the design at once.
// It suffices in Hone to just assume I'll load a model from WebLLM.
const MODEL_ID = WEBLLM_MODEL;

let isTimePredictionsInitialized = false;
async function _initPredictionsAsNeeded() {
  if (!isTimePredictionsInitialized) {
    await initializeTimePredictions();
    isTimePredictionsInitialized = true;
    if (predictTime(MODEL_ID) === 0) { // TODO - pass the defaults in to initializeTimePredictions() and have it set them there if needed. But sort that out with the other design issues with model selection.
      setDefault(`${MODEL_ID}-cached`, 28000);
      setDefault(`${MODEL_ID}-first`, 120000);
    }
  }
}

async function _getPredictionFactors(modelId:string):Promise<string> {
  const isCached = await isModelCached(modelId);
  const cachedStateText = isCached ? 'cached' : 'first';
  return `${modelId}-${cachedStateText}`;
}

export async function predictLoadTime():Promise<number> {
  await _initPredictionsAsNeeded();
  const factors = await _getPredictionFactors(MODEL_ID);
  return predictTime(factors);
}

async function _storeTimePredictionData(actualTime:number) {
  await _initPredictionsAsNeeded();
  const factors = await _getPredictionFactors(MODEL_ID);
  storeActualTime(factors, actualTime);
  await setModelCached(MODEL_ID);
}

export function isInitialized():boolean { return theConnection.state === LLMConnectionState.READY || theConnection.state === LLMConnectionState.GENERATING; }

export async function init(onStatusUpdate:StatusUpdateCallback) {
  if (isInitialized()) return;
  theConnection.state = LLMConnectionState.INITIALIZING;
  const startMSecs = Date.now();
  const connectionSuccess = await connectToCustomLLM(theConnection, onStatusUpdate) || await connectToWebLLM(theConnection, onStatusUpdate);
  if (!connectionSuccess) { 
    theConnection.webLLMEngine = null;
    theConnection.serverUrl = null;
    theConnection.connectionType = LLMConnectionType.NONE;
    theConnection.state = LLMConnectionState.INIT_FAILED;
    throw new Error('Failed to connect to LLM.');
  }
  const elapsed = Date.now() - startMSecs;
  _storeTimePredictionData(elapsed);
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
    case LLMConnectionType.CUSTOM: message = await generateCustomLLM(theConnection, messages, prompt, onStatusUpdate); break;
    default: throw Error('Unexpected');
  }
  setCachedPromptResponse(prompt, message);
  updateStatsForPrompt(Date.now() - promptStartTime);
  theConnection.state = LLMConnectionState.READY;
  return message;
}