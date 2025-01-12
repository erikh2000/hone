import TimePredictions from "@/timePredictions/types/TimePredictions";
import { CACHED_MODELS_MANIFEST_KEY, TIME_PREDICTIONS_KEY } from "./pathTemplates";
import { getText, setText } from "./pathStore";
import { MIMETYPE_JSON } from "./mimeTypes";

function _isTimePredictions(obj:any):boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  for (const key in obj) {
    const prediction = obj[key];
    if (typeof prediction !== 'object') return false;
    const {previousTimes, defaultTime} = prediction;
    if (!Array.isArray(previousTimes)) return false;
    if (previousTimes.some((t:any) => typeof t !== 'number')) return false;
    if (typeof defaultTime !== 'number') return false;
  }
  return true;
}

export async function getTimePredictions():Promise<TimePredictions|null> {
  const jsonText = await getText(TIME_PREDICTIONS_KEY);
  if (!jsonText) return null;
  const obj = JSON.parse(jsonText);
  const predictions = obj as TimePredictions;
  if (!_isTimePredictions(predictions)) throw Error(`Persisted value at ${TIME_PREDICTIONS_KEY} is in unexpected format.`);
  return predictions;
}

export async function setTimePredictions(predictions:TimePredictions) {
  const jsonText = JSON.stringify(predictions);
  await setText(TIME_PREDICTIONS_KEY, jsonText, MIMETYPE_JSON);
}

async function _getCachedModelIds():Promise<string[]> {
  const text = await getText(CACHED_MODELS_MANIFEST_KEY);
  return text ? text.split('\n') : [];
}

/*  It would be more direct to go look at WebLLM's created cache, but then I'd be relying on non-contractual 
    behavior that can break. This is good enough for now. Alternatives: 
    1. Parse the status messages after WebLLM starts loading. 
    2. Use a WebLLM API that tells me. Doesn't exist now, but could try contributing. */
export async function isModelCached(modelId:string):Promise<boolean> {
  const cachedModelIds = await _getCachedModelIds();
  return cachedModelIds.includes(modelId);
}

export async function setModelCached(modelId:string) {
  const cachedModelIds = await _getCachedModelIds();
  if (cachedModelIds.includes(modelId)) return;
  cachedModelIds.push(modelId);
  const text = cachedModelIds.join('\n');
  await setText(CACHED_MODELS_MANIFEST_KEY, text);
}