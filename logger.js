
class Logger {
  constructor(level = 'INFO') {
    this.level = level;
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
  }
  
  shouldLog(messageLevel) {
    return this.levels[messageLevel] <= this.levels[this.level];
  }
  
  formatMessage(level, ...args) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${args.join(' ')}`;
  }
  
  log(...args) {
    if (this.shouldLog('INFO')) {
      console.log(this.formatMessage('INFO', ...args));
    }
  }
  
  error(...args) {
    if (this.shouldLog('ERROR')) {
      console.error(this.formatMessage('ERROR', ...args));
    }
  }
  
  warn(...args) {
    if (this.shouldLog('WARN')) {
      console.warn(this.formatMessage('WARN', ...args));
    }
  }
  
  debug(...args) {
    if (this.shouldLog('DEBUG')) {
      console.debug(this.formatMessage('DEBUG', ...args));
    }
  }
  }
  
  export default Logger;