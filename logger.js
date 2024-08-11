const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

let currentLogLevel = LOG_LEVELS.INFO;

function setLogLevel(level) {
  if (LOG_LEVELS.hasOwnProperty(level)) {
    currentLogLevel = LOG_LEVELS[level];
  }
}

function log(level, message, ...args) {
  if (LOG_LEVELS[level] >= currentLogLevel) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`, ...args);
  }
}

function debug(message, ...args) {
  log('DEBUG', message, ...args);
}

function info(message, ...args) {
  log('INFO', message, ...args);
}

function warn(message, ...args) {
  log('WARN', message, ...args);
}

function error(message, ...args) {
  log('ERROR', message, ...args);
}

export default {
  setLogLevel,
  debug,
  info,
  warn,
  error,
};