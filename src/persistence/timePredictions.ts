import TimePredictions from "@/timePredictions/types/TimePredictions";
import { TIME_PREDICTIONS_KEY } from "./pathTemplates";
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