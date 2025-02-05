const DEFAULT_FIRST_DELAY = 100;

function _findDelayForFrequency(now:number, eventTimes: number[], maxEventCount: number, overDurationMSecs: number):number {
  if (maxEventCount === 0) return 0;
  const waitForExpiredEventCount = eventTimes.length - maxEventCount + 1;
  if (waitForExpiredEventCount < 1) return 0;
  const thresholdEventTime = eventTimes[waitForExpiredEventCount - 1];
  return  (thresholdEventTime + overDurationMSecs) - now; // We must wait this long to expire the needed count of events, putting us under the frequency threshold.
}

function _removeEventsPastDuration(now:number, eventTimes: number[], overDurationMSecs: number) {
  return eventTimes.filter(time => now - time < overDurationMSecs);
}

function _findDelayForExtra(now:number, extraDelay:number, extraDelaySetTime:number):number {
  return extraDelay === 0 ? 0 : extraDelay - (now - extraDelaySetTime);
}

function _getReadyWaitTime(now:number, eventTimes:number[], extraDelay:number, extraDelaySetTime:number,  maxEventCount:number, overDurationMSecs:number) {
  const delayForFrequency = _findDelayForFrequency(now, eventTimes, maxEventCount, overDurationMSecs);
  const delayForExtra = _findDelayForExtra(now, extraDelay, extraDelaySetTime);
  return Math.max(delayForFrequency, delayForExtra);
}

class Throttler {
  private _eventTimes:number[];
  private _duration:number;
  private _maxEventCount:number;
  private _extraDelay:number;
  private _extraDelaySetTime:number;
  private _lastDelay:number;

  // Passing 0 for maxEventCount indicates no frequency-based throttling.
  constructor(maxEventCount:number, overDurationMSecs:number) {
    this._eventTimes = [];
    this._duration = overDurationMSecs;
    this._maxEventCount = maxEventCount;
    this._extraDelay = this._extraDelaySetTime = 0;
    this._lastDelay = DEFAULT_FIRST_DELAY / 2;
  }

  // Call before start of attempts around a request to reset doubling delays. Doesn't 
  // clear event history for frequency-based throttling.
  resetWaitDoubling(firstDelayMSecs = DEFAULT_FIRST_DELAY) {
    if (firstDelayMSecs <= 0) throw Error('firstDelayMSecs must be > 0');
    this._extraDelaySetTime = this._extraDelay = 0;
    this._lastDelay = firstDelayMSecs / 2;
  }

  // Intended for wait-and-double pattern around retries. Will set an initial delay
  // on first call, and then double it for subsequent calls. Frequency-based throttling
  // is applied independently.
  doubleNextWait(now:number = Date.now()) {
    this._lastDelay *= 2;
    this._extraDelay = this._lastDelay;
    this._extraDelaySetTime = now;
  }

  // Returns the delay to wait before making a request and tracks the request timing.
  // Use this method instead of waitBeforeRequest() if you want to handle the wait in calling code.
  prepareBeforeRequest(now:number = Date.now()):number {
    if (this._maxEventCount) this._eventTimes = _removeEventsPastDuration(now, this._eventTimes, this._duration);
    const delayMSecs = _getReadyWaitTime(now, this._eventTimes, this._extraDelay, this._extraDelaySetTime, this._maxEventCount, this._duration);
    if (this._maxEventCount) this._eventTimes.push(now + delayMSecs);
    return delayMSecs;
  }

  // Waits the right amount of time ahead of a request and tracks the request timing.
  async waitBeforeRequest(now:number = Date.now()) {
    if (this._maxEventCount) this._eventTimes = _removeEventsPastDuration(now, this._eventTimes, this._duration);
    const delayMSecs = _getReadyWaitTime(now, this._eventTimes, this._extraDelay, this._extraDelaySetTime, this._maxEventCount, this._duration);
    if (delayMSecs > 0) await new Promise(resolve => setTimeout(resolve, delayMSecs));    
    if (this._maxEventCount) this._eventTimes.push(now);
  }
}

export default Throttler;