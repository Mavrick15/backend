const fs = require('node:fs').promises;
const path = require('node:path');

const LOG_CONSTANTS = {
  LOGS_DIR_NAME: 'logs',
  LOG_FILE_NAME: 'app.log',
  ERROR_CRITICAL_DIR_CREATE: (message) => `[${new Date().toISOString()}] ERREUR CRITIQUE: Impossible de créer le répertoire de logs: ${message}`,
  ERROR_WRITE_FILE: (timestamp, message) => `[${timestamp}] ERREUR: Impossible d'écrire dans le fichier de log: ${message}`,
  CONSOLE_LOG_FORMAT: (timestamp, level, message) => `[${timestamp}] ${level.toUpperCase()}: ${message}`,
};

class Logger {
  constructor() {
    this.logsDir = path.join(process.cwd(), LOG_CONSTANTS.LOGS_DIR_NAME);
    this.logFile = path.join(this.logsDir, LOG_CONSTANTS.LOG_FILE_NAME);
    this.initializeLogDirectory();
  }

  async initializeLogDirectory() {
    try {
      await fs.mkdir(this.logsDir, { recursive: true });
    } catch (error) {
      console.error(LOG_CONSTANTS.ERROR_CRITICAL_DIR_CREATE(error.message));
    }
  }

  async writeLog(level, message, meta) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(meta && { meta })
    };

    console.log(LOG_CONSTANTS.CONSOLE_LOG_FORMAT(timestamp, level, message));

    try {
      await fs.appendFile(this.logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error(LOG_CONSTANTS.ERROR_WRITE_FILE(timestamp, error.message));
    }
  }

  info(message, meta) {
    this.writeLog('info', message, meta);
  }

  error(message, meta) {
    this.writeLog('error', message, meta);
  }

  warn(message, meta) {
    this.writeLog('warn', message, meta);
  }
}

module.exports = { logger: new Logger() };
