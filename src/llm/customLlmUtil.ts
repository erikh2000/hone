import { isHostListeningAtUrl } from "@/common/hostUtil";
import LLMConnection from "./types/LLMConnection";
import LLMConnectionType from "./types/LLMConnectionType";
import StatusUpdateCallback from "./types/StatusUpdateCallback";
import CustomLLMConfig, { JsonCustomLLMConfig, CompletionOptions } from "./types/CustomLLMConfig";
import { baseUrl, normalizeUrl, parseDomainUrlFromUrl } from "@/common/urlUtil";
import LLMMessages from "./types/LLMMessages";
import { addAssistantMessageToChatHistory, addUserMessageToChatHistory, createChatHistory } from "./messageUtil";
import LLMMessage from "./types/LLMMessage";
import StreamCompletionReader from "./StreamCompletionReader";
import Throttler from "./Throttler";
import { clearCustomLlmUserSettings, getCustomLlmUserSettings, setCustomLlmUserSettings } from "@/persistence/customLlmUserSettings";

const CUSTOM_CONFIG_URL = '/custom/llmConfig.json';
let throttler:Throttler|null = null;

// Throw if I can see a problem where the config object doesn't match the Typescript format above. I won't try to find everything wrong, 
// since a later fetch() for a chat completion request will throw or return unusable response data. This is just to catch obvious errors
// with more cause-correlated error messages.
function _throwForInvalidCustomLLMConfig(config:unknown):void {
  if (typeof config !== 'object' || config === null) throw new Error('Invalid custom LLM config: not an object');
  if (typeof (config as JsonCustomLLMConfig).completionUrl !== 'string') throw new Error('Invalid custom LLM config: missing completionUrl');
  if (typeof (config as JsonCustomLLMConfig).maxRequestsPerMinute !== 'number') throw new Error('Invalid custom LLM config: missing maxRequestsPerMinute');
  if (typeof (config as JsonCustomLLMConfig).userSettings !== 'object' || (config as JsonCustomLLMConfig).userSettings === null) throw new Error('Invalid custom LLM config: missing userSettings');
  if (typeof (config as JsonCustomLLMConfig).completionOptions !== 'object' || (config as JsonCustomLLMConfig).completionOptions === null) throw new Error('Invalid custom LLM config: missing completionOptions');
  const completionOptions = (config as JsonCustomLLMConfig).completionOptions;
  if (typeof completionOptions.method !== 'string') throw new Error('Invalid custom LLM config: missing method in completionOptions');
  if (completionOptions.headers && typeof completionOptions.headers !== 'object') throw new Error('Invalid custom LLM config: headers in completionOptions is not an object');
  if (typeof completionOptions.body !== 'object' || completionOptions.body === null) throw new Error('Invalid custom LLM config: body in completionOptions is not an object');
}

// Example: "Access Token" -> "%ACCESS_TOKEN%". 
function _displayToVariableName(displayName:string):string {
  return '%' + displayName.toUpperCase().replaceAll(' ', '_') + '%';
}

// In returned object, the display name of each variable is converted to a variable name.
function _createReplacementVariables(userSettings:Record<string,string>):Record<string,string>|null {
  const replacementVariables:Record<string,string> = {};
  for (const key in userSettings) {
    const newKey = _displayToVariableName(key);
    replacementVariables[newKey] = userSettings[key];
  }
  return Object.keys(replacementVariables).length ? replacementVariables : null;
}

function _makeUserSettingReplacements(config:CustomLLMConfig):CustomLLMConfig {
  const replacementVariables = _createReplacementVariables(config.userSettings);
  if (!replacementVariables) return config; // No replacements to make.
  // For simplicity, make replacements against the whole string, and then parse it back to an object.
  // This means that some parts of the config that don't need replacements will be evaluated, but it's benign
  // because the variable format is unique enough to not cause accidental replacements, and it doesn't allow  
  // for a useful exploit due to mutual exploitability.
  let jsonText = JSON.stringify(config); 
  for (const key in replacementVariables) {
    const value = replacementVariables[key];
    jsonText = jsonText.replaceAll(key, value);
  }
  return JSON.parse(jsonText) as CustomLLMConfig;
}

function _createFetchOptions(messages:LLMMessage[], completionOptions:CompletionOptions):Object {
  const options:any = {...completionOptions};
  options.body.messages = messages;
  options.body = JSON.stringify(options.body);
  return options;
}

/*
  Public APIs
*/

export async function customLlmLoadConfig():Promise<CustomLLMConfig|null> {
  const response = await fetch(baseUrl(CUSTOM_CONFIG_URL));
  if (response.status !== 200 || response.headers.get('content-type') !== 'application/json') return null;
  const jsonObject = await response.json();
  _throwForInvalidCustomLLMConfig(jsonObject);
  jsonObject.persistUserSettings = await getCustomLlmUserSettings(jsonObject); // If settings were available, it implies an earlier decision to persist.
  
  return jsonObject as CustomLLMConfig;
}

export async function customLlmConnect(connection:LLMConnection, onStatusUpdate:StatusUpdateCallback):Promise<boolean> {
  try {
    if (!connection.customLLMConfig) throw Error('Unexpected');

    const customLLMConfig = connection.customLLMConfig = _makeUserSettingReplacements(connection.customLLMConfig);
    if (customLLMConfig.persistUserSettings) {
      onStatusUpdate('Saving custom LLM user settings...', 0);
      await setCustomLlmUserSettings(customLLMConfig.userSettings);
    } else {
      onStatusUpdate('Clearing custom LLM user settings...', 0);
      await clearCustomLlmUserSettings();
    }

    customLLMConfig.completionUrl = normalizeUrl(customLLMConfig.completionUrl);
    connection.serverUrl = parseDomainUrlFromUrl(customLLMConfig.completionUrl);
    if (!await isHostListeningAtUrl(customLLMConfig.completionUrl)) { 
      console.error(`Custom LLM host is not responding at ${customLLMConfig.completionUrl}`);
      return false;
    }
    connection.connectionType = LLMConnectionType.CUSTOM;
    throttler = new Throttler(customLLMConfig.maxRequestsPerMinute, 60 * 1000);
    return true;
  } catch(e) {
    console.error('Error while connecting to custom LLM.', e);
    return false;
  }
}

const INITIAL_DOUBLING_DELAY = 500;
const MAX_REQUEST_ATTEMPTS = 5;
export async function customLlmGenerate(connection:LLMConnection, llmMessages:LLMMessages, prompt:string, onStatusUpdate:StatusUpdateCallback):Promise<string> {
  const customLLMConfig = connection.customLLMConfig;
  if (!customLLMConfig || !throttler) throw Error('Unexpected');

  const messages = createChatHistory(llmMessages, prompt);

  const fetchOptions = _createFetchOptions(messages, customLLMConfig.completionOptions);
  
  addUserMessageToChatHistory(llmMessages, prompt);

  let response:Response|null = null, attemptNo = 0;
  throttler.resetWaitDoubling(INITIAL_DOUBLING_DELAY);
  for(; attemptNo < MAX_REQUEST_ATTEMPTS; attemptNo++) {
    await throttler.waitBeforeRequest();
    response = await fetch(customLLMConfig.completionUrl, fetchOptions);
    if (response.status === 200) break;
    if (response.status === 429) { 
      console.warn(`Custom LLM host is rate-limiting. Will retry again after with doubled wait.`); 
      throttler.doubleNextWait();
      continue; 
    }
    if (response.status !== 200) throw Error(`Response status code ${response.status} from custom LLM.`);
  }
  if (!response || attemptNo === MAX_REQUEST_ATTEMPTS) throw Error('Failed to get response from custom LLM.');

  let messageText = '';
  const reader = new StreamCompletionReader(response);
  do {
    const nextText = await reader.readNextMessage();
    if (!nextText) continue;
    messageText += nextText;
    onStatusUpdate(messageText, reader.isMore ? 1 : 0);
  } while (reader.isMore);

  onStatusUpdate(messageText, 1);
  addAssistantMessageToChatHistory(llmMessages, messageText);
  return messageText;
}

export function areUserSettingsMissing(userSettings:Record<string,string>):boolean {
  for (const key in userSettings) {
    const value = userSettings[key];
    if (value === null || value === '') return true;
  }
  return false;
}