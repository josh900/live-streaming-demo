class Logger {
  constructor(level = 'INFO') {
    this.level = level;
  }

  log(...args) {
    if (this.level === 'INFO' || this.level === 'DEBUG') {
      console.log(...args);
    }
  }

  error(...args) {
    console.error(...args);
  }

  debug(...args) {
    if (this.level === 'DEBUG') {
      console.debug(...args);
    }
  }
}

export default Logger;