export type MovingAverageData = {
  series: number[],
  seriesMax: number,
  lastAverage: number
}

export function createMovingAverage(seriesMax: number): MovingAverageData {
  return { series:[], seriesMax, lastAverage:0 };
}

export function updateMovingAverage(nextValue:number, movingAverageData:MovingAverageData):number {
  const { series, seriesMax } = movingAverageData;
  series.push(nextValue);
  if (series.length > seriesMax) series.shift();
  const sum = series.reduce((acc, val) => acc + val, 0);
  movingAverageData.lastAverage = sum / series.length;
  return movingAverageData.lastAverage;
}