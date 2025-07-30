const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    if (process.env.NODE_ENV === 'production') {
      this.ensureLogDirectory();
    }
  }

  ensureLogDirectory() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create log directory:', error.message);
    }
  }

  formatMessage(level, message, meta = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message: typeof message === 'string' ? message : JSON.stringify(message),
      pid: process.pid,
      ...meta
    };

    return JSON.stringify(logEntry);
  }

  writeToFile(level, formattedMessage) {
    if (process.env.NODE_ENV !== 'production') return;

    try {
      const logFile = path.join(this.logDir, `${level}.log`);
      fs.appendFileSync(logFile, formattedMessage + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  log(level, message, meta = {}) {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    const colors = {
      error: '\x1b[31m',   
      warn: '\x1b[33m',    
      info: '\x1b[36m',   
      debug: '\x1b[35m',  
      reset: '\x1b[0m'    
    };
    
    const color = colors[level] || colors.info;
    console.log(`${color}${formattedMessage}${colors.reset}`);
    
    // Write to file in production
    this.writeToFile(level, formattedMessage);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, meta);
    }
  }
}

module.exports = new Logger();