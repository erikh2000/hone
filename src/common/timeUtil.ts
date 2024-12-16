// Summarize duration casually, e.g., user won't care about seconds when duration's more than a few minutes.
export function describeDuration(seconds:number):string {
  seconds = Math.ceil(seconds);
  const hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;
  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;

  if (hours > 0) {
    let hoursSummary = hours === 1 ? '1 hour' : `${hours} hours`;
    if (minutes > 0) {
      hoursSummary += minutes === 1 ? ' 1 minute' : ` ${minutes} minutes`;
    }
    return hoursSummary;
  }

  if (minutes > 0) {
    let minutesSummary = minutes === 1 ? '1 minute' : `${minutes} minutes`;
    if (minutes < 2 && seconds > 0) {
      minutesSummary += seconds === 1 ? ' 1 second' : ` ${seconds} seconds`;
    }
    return minutesSummary;
  }

  return seconds === 1 ? '1 second' : `${seconds} seconds`;
}