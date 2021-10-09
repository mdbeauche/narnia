const process = require('process');
const express = require('express');
const mysql = require('mysql2/promise');
const { PROJECT_NAME, PORT, DB_NAME, DB_HOST, DB_USER } = require('./config');
const { version } = require('../package.json');
const middleware = require('./util/middleware');
const usersRouter = require('./routers/users');
const logger = require('./util/logger');
require('dotenv').config();

let server;
let database;
const app = express();

app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use(express.json());

middleware.forEach((m) => app.use(m));

app.get('/', (req, res) => {
  res.json({
    name: PROJECT_NAME,
    version,
    uptime: process.uptime(),
  });
});

app.use('/users', usersRouter);

// server application utilities
function shutdown(signal) {
  if (signal) {
    logger.log(`\nReceived signal ${signal}`);
  }

  server?.close(() => {
    logger.log('HTTP server closed');
  });

  database?.end(() => {
    logger.log('Database connection ended');
  });

  logger.log('Shutdown complete');

  process.exit(signal && typeof signal === 'number' ? signal : 0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGQUIT', shutdown);

process.on('uncaughtException', (err, origin) => {
  logger.error(`Caught exception: ${err}`);
  logger.error(`Exception origin: ${origin}`);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.start = async () => {
  try {
    database = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: process.env.DB_PASSWORD,
      database: DB_NAME,
    });
    app.db = database;

    logger.log(`Connected to database as id ${database.threadId}`);

    server = app.listen(PORT, () => {
      logger.log(`Server running on port ${PORT}`);
      console.log('(Press CTRL+C to quit)');
    });
  } catch (error) {
    logger.error(error);
    await shutdown(1);
  }
};

app.stop = async () => {
  shutdown();
};

// start the server if run from node (don't start it when run from testing suite)
if (require.main === module) {
  app.start();
}

module.exports = app;
