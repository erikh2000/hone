// ANSI text-formatting codes for console output.
export const ANSI_START_GREEN = "\x1b[32m";
export const ANSI_START_RED = "\x1b[31m";
export const ANSI_START_BOLD = "\x1b[1m";
export const ANSI_RESET = "\x1b[0m";

export function logError(message, exception) {
  console.error(`${ANSI_START_RED}${ANSI_START_BOLD}Error: ${ANSI_RESET}${message}`);
  if (exception) console.error(exception);
}

export function logSuccess(message) {
  console.log(`${ANSI_START_BOLD}Subtask Success: ${ANSI_RESET}${message}`);
}

// Reserve the green formatting for an overall success message at end of an operation.
export function logOverallSuccess(message) {
  console.log(`${ANSI_START_GREEN}${ANSI_START_BOLD}Operation Success: ${ANSI_RESET}${message}`);
}

export function fatalError(message) {
  if (!message) message = 'Exiting script due to preceding error.';
  console.log(`${ANSI_START_RED}Fatal Error:${ANSI_RESET} ${message}`);
  process.exit(1);
}