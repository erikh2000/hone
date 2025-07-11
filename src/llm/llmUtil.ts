/*
  This module is an abstraction layer for LLM APIs.

  General Usage:
  * call connect() to initialize the connection and pass in a CustomLLMConfig object if you want to use a custom LLM instead of WebLLM.
  * call generate() to get a response for a prompt. This will call to WebLLM or CustomLLM depending on the previous call to connect().
  * other APIs are there for setting system message, chat history, etc.
*/
import { updateModelDeviceLoadHistory, updateModelDevicePerformanceHistory } from 'decent-portal';

import LLMConnection from "./types/LLMConnection";
import LLMConnectionState from "./types/LLMConnectionState";
import LLMConnectionType from "./types/LLMConnectionType";
import LLMMessages from "./types/LLMMessages";
import StatusUpdateCallback from "./types/StatusUpdateCallback";
import { webLlmConnect, webLlmGenerate, WEBLLM_MODEL } from "./webLlmUtil";
import { updateStatsForPrompt } from "./llmStatsUtil";
import { getCachedPromptResponse, setCachedPromptResponse } from "./promptCache";
import { isModelCached, setModelCached } from "@/persistence/timePredictions";
import { predictTime, storeActualTime, initialize as initializeTimePredictions, setDefault } from "@/timePredictions/timePredictionUtil";
import { customLlmConnect, customLlmGenerate } from "./customLlmUtil";
import CustomLLMConfig from "./types/CustomLLMConfig";

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

const MODEL_ID = WEBLLM_MODEL;

let isTimePredictionsInitialized = false;
async function _initPredictionsAsNeeded() {
  if (!isTimePredictionsInitialized) {
    await initializeTimePredictions();
    isTimePredictionsInitialized = true;
    if (predictTime(MODEL_ID) === 0) {
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

async function _storeTimePredictionData(actualTime:number) {
  await _initPredictionsAsNeeded();
  const factors = await _getPredictionFactors(MODEL_ID);
  storeActualTime(factors, actualTime);
  await setModelCached(MODEL_ID);
}

function _clearConnectionAndThrow(message:string) {
  theConnection.webLLMEngine = null;
  theConnection.serverUrl = null;
  theConnection.connectionType = LLMConnectionType.NONE;
  theConnection.state = LLMConnectionState.INIT_FAILED;
  throw new Error(message);
}

/*
  Public APIs
*/

export async function predictLoadTime():Promise<number> {
  await _initPredictionsAsNeeded();
  const factors = await _getPredictionFactors(MODEL_ID);
  return predictTime(factors);
}

export function isLlmConnected():boolean {
  return theConnection.state === LLMConnectionState.READY || theConnection.state === LLMConnectionState.GENERATING;
}

export async function connect(onStatusUpdate:StatusUpdateCallback, customLLMConfig:CustomLLMConfig|null = null) {
  if (isLlmConnected()) return;
  theConnection.state = LLMConnectionState.INITIALIZING;
  if (customLLMConfig) {
    theConnection.customLLMConfig = customLLMConfig;
    theConnection.connectionType = LLMConnectionType.CUSTOM;
    if (!await customLlmConnect(theConnection, onStatusUpdate)) _clearConnectionAndThrow('Failed to connect to custom LLM.');
  } else {
    const startMSecs = Date.now();
    if (!await webLlmConnect(theConnection, onStatusUpdate)) { 
      await updateModelDeviceLoadHistory(MODEL_ID, false);
      _clearConnectionAndThrow('Failed to connect to WebLLM.');
    }
    const elapsed = Date.now() - startMSecs;
    await updateModelDeviceLoadHistory(MODEL_ID, true, elapsed);
    _storeTimePredictionData(elapsed);
  }
  theConnection.state = LLMConnectionState.READY;
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

function _getMessagesCharCount():number {
  return messages.chatHistory.reduce((count, message) => {
    return count + message.content.length;
  }, 0);
}

export async function generate(prompt:string, onStatusUpdate:StatusUpdateCallback):Promise<string> {
  const cachedResponse = getCachedPromptResponse(prompt);
  if (cachedResponse) {
    onStatusUpdate(cachedResponse, 100);
    return cachedResponse;
  }

  let firstResponseTime = 0;
  function _onStatusUpdate(message:string, progress:number) {
    if (!firstResponseTime) firstResponseTime = Date.now();
    onStatusUpdate(message, progress);
  }

  if (!isLlmConnected()) throw Error('LLM connection is not initialized.');
  if (theConnection.state !== LLMConnectionState.READY) throw Error('LLM is not in ready state.');
  theConnection.state = LLMConnectionState.GENERATING;
  let promptStartTime = Date.now();
  let message = '';
  switch(theConnection.connectionType) {
    case LLMConnectionType.WEBLLM: 
      message = await webLlmGenerate(theConnection, messages, prompt, _onStatusUpdate);
      updateModelDevicePerformanceHistory(MODEL_ID, promptStartTime, firstResponseTime, Date.now(), prompt.length + _getMessagesCharCount(), message.length);
    break;
    case LLMConnectionType.CUSTOM: 
      message = await customLlmGenerate(theConnection, messages, prompt, onStatusUpdate);
      const CUSTOM_MODEL_ID = theConnection.customLLMConfig?.completionUrl ?? 'UNEXPECTED';
      updateModelDevicePerformanceHistory(CUSTOM_MODEL_ID, promptStartTime, firstResponseTime, Date.now(), prompt.length + _getMessagesCharCount(), message.length);
    break;
    default: throw Error('Unexpected');
  }
  setCachedPromptResponse(prompt, message);
  updateStatsForPrompt(Date.now() - promptStartTime); // This is redundant with model device performance. TODO make time prediction use model device performance instead.
  theConnection.state = LLMConnectionState.READY;
  return message;
}