const fs = require('fs');
const moment = require('moment');
const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');
require('dotenv').config();
const { LOG_DIR } = require('../config');

// set up winston logger
const logPath = path.join(process.cwd(), LOG_DIR);

if (!fs.existsSync(logPath)) {
  // create log directory if not present
  fs.mkdirSync(logPath);
}

const loggerClient = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.json(),
    winston.format.timestamp({
      format: moment().toISOString(),
    }),
    winston.format.prettyPrint(),
    // winston.format.simple(),
  ),
  transports: [
    // write all logs to console
    new winston.transports.Console({
      level: process.env.DEBUG === 'true' ? 'info' : 'error',
      // colorize the console output, flatten to a single line
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info) =>
            `${info.timestamp} ${info.level}: ${JSON.stringify(
              info.message,
              null,
              2,
            )}`,
        ),
      ),
    }),
    // write all logs error (and below) to `error.log`
    new winston.transports.DailyRotateFile({
      filename: path.join(logPath, 'error.log'),
      level: 'error',
      maxSize: '10m', // megabytes
      maxFiles: '30d', // days
      datePattern: 'YYYY-MM-DD-HH',
    }),
    // write all logs with level `info` and below to `combined.log`
    new winston.transports.DailyRotateFile({
      filename: path.join(logPath, 'combined.log'),
      level: 'info',
      maxSize: '10m', // megabytes
      maxFiles: '30d', // days
      datePattern: 'YYYY-MM-DD-HH',
    }),
  ],
});

// create a singleton
Object.freeze(loggerClient);

const logger = {
  log: (msg) => {
    loggerClient.log('info', msg, {});
  },
  info: (msg) => {
    loggerClient.log('info', msg, {});
  },
  error: (msg) => {
    loggerClient.log('error', msg, {});
  },
};

module.exports = logger;
