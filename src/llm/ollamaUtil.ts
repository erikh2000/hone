import { isHostListening } from "@/common/hostUtil";
import OllamaReader from "./OllamaReader";
import LLMConnection from "./types/LLMConnection";
import LLMConnectionType from "./types/LLMConnectionType";
import StatusUpdateCallback from "./types/StatusUpdateCallback";
import { addAssistantMessageToChatHistory, addUserMessageToChatHistory, createChatHistory } from "./messageUtil";
import LLMMessages from "./types/LLMMessages";

const MODEL = "llama3.1";
const DOMAIN = '127.0.0.1';
const PORT = 11434;

function _normalizeModelName(modelName:string):string {
  return modelName.split(':')[0].trim().toLowerCase();
}

function _parsePullModelChunk(chunk:Object):[status:string, percentComplete:number] {
  const DEFAULT_STATUS = 'Receiving model...';
  try {
    const status =(chunk as any).status || DEFAULT_STATUS;
    const totalSize = (chunk as any).total || 0;
    const receivedSize = (chunk as any).completed || 0;
    const percentComplete = totalSize > 0 ? receivedSize / totalSize : 0;
    return [status, percentComplete];
  } catch(_ignored) {
    return [DEFAULT_STATUS, 0];
  }
}

async function _findOllamaServer():Promise<string|null> {
  const domain = DOMAIN;
  const port = PORT;
  return await isHostListening(domain, port, 1000) ? `http://${domain}:${port}` : null;
}

async function _doesOllamaHaveModel(serverUrl:string, modelName:string):Promise<boolean> {
  const tagRequestUrl = `${serverUrl}/api/tags`;
  const response = await fetch(tagRequestUrl);
  if (!response.ok) throw Error('Failed to get tags from Ollama.');
  const json = await response.json();
  
  const matchModelName = _normalizeModelName(modelName);
  const models = json.models;
  return models.some((model:any) => _normalizeModelName(model.name) === matchModelName);
}


async function _pullOllamaModel(serverUrl:string, modelName:string, onStatusUpdate:StatusUpdateCallback) {
  const pullRequestUrl = `${serverUrl}/api/pull`;
  const body = { model: modelName, stream:true };
  const response = await fetch(pullRequestUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw Error('Failed to pull model from Ollama.');
  
  const reader = new OllamaReader(response);
  if (!reader) throw Error('Failed to get reader from response.');
  while(reader.isMore) {
    const obj = await reader.readNextJsonObject();
    if (!obj) continue;
    const [status, percentComplete] = _parsePullModelChunk(obj);
    onStatusUpdate(status, percentComplete);
  }
}

export async function generateOllama(connection:LLMConnection, llmMessages:LLMMessages, prompt:string, onStatusUpdate:StatusUpdateCallback):Promise<string> {
  if (!connection.serverUrl) throw Error('Unexpected');
  const chatUrl = `${connection.serverUrl}/api/chat`;

  const messages = createChatHistory(llmMessages, prompt);
  addUserMessageToChatHistory(llmMessages, prompt);

  const options = { // Model-specific options unlike WebLLM.
    "max_tokens": 10
  };

  const body = {
    "model": MODEL,
    options,
    messages
  };

  const response = await fetch(chatUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) throw Error('Failed to generate response from Ollama.');

  let messageText = '';
  const reader = new OllamaReader(response);
  do {
    const nextText = await reader.readNextMessage();
    if (!nextText) continue;
    messageText += nextText;
    onStatusUpdate(messageText, reader.isMore ? 1 : 0);
  } while (reader.isMore);
  
  addAssistantMessageToChatHistory(llmMessages, messageText);

  return messageText;
}

export async function connectToOllama(connection:LLMConnection, onStatusUpdate:StatusUpdateCallback):Promise<boolean> {
  let highestPercentComplete = 0;
  try {
    connection.connectionType = LLMConnectionType.OLLAMA;
    onStatusUpdate('Looking for an Ollama server...', 0);
    connection.serverUrl = await _findOllamaServer();
    if (connection.serverUrl === null) return false;
    onStatusUpdate('Getting available models...', .1);
    if (!await _doesOllamaHaveModel(connection.serverUrl, MODEL)) {
      onStatusUpdate('Loading model...', .2);
      await _pullOllamaModel(connection.serverUrl, MODEL, (status:string, percentComplete:number) => {
        if (percentComplete > highestPercentComplete) highestPercentComplete = percentComplete; // Avoid showing backward progress.
        onStatusUpdate(status, .2 + highestPercentComplete * .8);
      });
    }
    onStatusUpdate('Ollama is ready.', 1);
    return true;
  } catch(e) {
    console.error('Error while connecting to Ollama.', e);
    return false;
  }
}