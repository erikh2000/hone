import { getTimePredictions, setTimePredictions } from "@/persistence/timePredictions";
import TimePrediction from "./types/TimePrediction";
import TimePredictions from "./types/TimePredictions";

let thePredictions:TimePredictions|null = null;
let hasScaledDefaults = false;

export const MAX_STORE_TIMES = 5;

function _averagePreviousTimes(previousTimes:number[]):number {
  return previousTimes.reduce((a,b) => a+b, 0) / previousTimes.length;
}

/* Call after first actual time collected to adjust all defaults based on how the actual time differed from its default. */
function _scaleDefaultsToMatchActualTime(actualTime:number, defaultTime:number) {
  const predictions = thePredictions as TimePredictions;
  if (!actualTime) return; // This is not going to be a useful time for scaling. Caller can try again with a better value.
  const adjustRatio = actualTime / defaultTime;
  for (const key in predictions) {
    const prediction = predictions[key];
    prediction.defaultTime *= adjustRatio;
  }
  hasScaledDefaults = true;
}

export async function initialize() {
  if (thePredictions) throw Error('Initialize only once.');
  thePredictions = await getTimePredictions() ?? {};
}

// Useful for unit testing.
export function deinitialize() {
  thePredictions = null;
  hasScaledDefaults = false;
}

export function setDefault(factors:string, defaultTime:number) {
  if (!thePredictions) throw Error('Initialize before calling.');
  const prediction:TimePrediction = thePredictions[factors];
  if (prediction) { prediction.defaultTime = defaultTime; return; }
  thePredictions[factors] = {previousTimes:[], defaultTime};
}

// factors is a string of relevant factors that uniquely identify a task for prediction purposes.
// You can concatenate them together any way you like, but should be unique to the task and have
// a chance of being repeatable when another task with the same factors needs a prediction. If
// the factors get too long, you can use a hash of the factors instead.
export function predictTime(factors:string):number {
  if (!thePredictions) throw Error('Initialize before calling.');
  const prediction:TimePrediction = thePredictions[factors];
  if (!prediction) return 0;
  const {previousTimes, defaultTime} = prediction;
  if (previousTimes.length === 0) return defaultTime;
  return _averagePreviousTimes(previousTimes);
}

export function storeActualTime(factors:string, msecs:number) {
  if (!thePredictions) throw Error('Initialize before calling.');
  let prediction:TimePrediction = thePredictions[factors];
  if (!prediction) {
    thePredictions[factors] = prediction = {previousTimes:[], defaultTime:msecs};
  }
  const {previousTimes} = prediction;
  previousTimes.push(msecs);
  if (previousTimes.length > MAX_STORE_TIMES) previousTimes.shift();
  if (!hasScaledDefaults) _scaleDefaultsToMatchActualTime(msecs, prediction.defaultTime);
  setTimePredictions(thePredictions); // Fire and forget on async write.
}