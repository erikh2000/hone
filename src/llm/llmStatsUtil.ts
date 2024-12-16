import { createMovingAverage, MovingAverageData, updateMovingAverage } from "@/common/simpleMovingAverage";

const IDEAL_PROMPT_AVERAGE_SERIES_COUNT = 5; // High enough to smooth out noise, low enough to avoid including stale performance data.

type LlmStats = {
  averageCompletionTime:MovingAverageData;
}

let theStats:LlmStats|null = null;

function _createLlmStats():LlmStats {
  return {
    averageCompletionTime:createMovingAverage(IDEAL_PROMPT_AVERAGE_SERIES_COUNT),
  };
}

export function updateStatsForPrompt(completionTime:number) {
  if (!theStats) theStats = _createLlmStats();
  updateMovingAverage(completionTime, theStats.averageCompletionTime);
}

export function getAverageCompletionTime():number {
  if (!theStats) return 0;
  return theStats.averageCompletionTime.lastAverage;
}