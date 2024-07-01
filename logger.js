class Logger {
  constructor(level = 'INFO') {
      this.level = level;
      this.levels = {
          'DEBUG': 0,
          'INFO': 1,
          'WARN': 2,
          'ERROR': 3
      };
  }

  log(...args) {
      if (this.shouldLog('INFO')) {
          console.log('[INFO]', ...args);
      }
  }

  debug(...args) {
      if (this.shouldLog('DEBUG')) {
          console.debug('[DEBUG]', ...args);
      }
  }

  warn(...args) {
      if (this.shouldLog('WARN')) {
          console.warn('[WARN]', ...args);
      }
  }

  error(...args) {
      if (this.shouldLog('ERROR')) {
          console.error('[ERROR]', ...args);
      }
  }

  shouldLog(messageLevel) {
      return this.levels[messageLevel] >= this.levels[this.level];
  }
}

export default Logger;