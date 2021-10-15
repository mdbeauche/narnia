const process = require('process');
const express = require('express');
const mysql = require('mysql2/promise');
const {
  PROJECT_NAME,
  PORT,
  DB_NAME,
  DB_HOST,
  DB_USER,
  CONNECTION_POOL_SIZE,
} = require('./config');
const { version } = require('../package.json');
const middleware = require('./util/middleware');
const TableRouter = require('./routers/database');
const logger = require('./util/logger');
require('dotenv').config();

let server;
let databasePool;
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
    success: true,
    data: [
      {
        name: PROJECT_NAME,
        version,
        uptime: process.uptime(),
      },
    ],
  });
});

// server application utilities
function shutdown(signal) {
  if (signal) {
    logger.log(`\nReceived signal ${signal}`);
  }

  server?.close(() => {
    logger.log('HTTP server closed');
  });

  databasePool?.end(() => {
    logger.log('Database pool connection ended');
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
    databasePool = await mysql.createPool({
      connectionLimit: CONNECTION_POOL_SIZE,
      host: DB_HOST,
      user: DB_USER,
      password: process.env.DB_PASSWORD,
      database: DB_NAME,
    });

    const db = {
      execute: async (query, fields) => {
        const results = await databasePool.query(query, fields);
        return results;
      },
      getConnection: async () => {
        // usage: getConnection() -> connection.query() -> connection.release()
        const connection = await databasePool.getConnection();
        return connection;
      },
    };

    app.db = db;

    logger.log(`Connected to database pool`);

    // need to initialize each table's routes after database is connected
    const showTables = await db.execute('SHOW TABLES;');
    const tables = showTables[0]?.map((itm) => Object.values(itm).join());
    app.get('/tables', (req, res) => {
      res.json({
        success: true,
        data: tables,
      });
    });

    for (const table of tables) {
      const tableRouter = new TableRouter(table);

      // eslint-disable-next-line no-await-in-loop
      await tableRouter.initialize(db);

      app.use(`/${table}`, tableRouter.tableRouter);
    }

    logger.log(`Tables available: ${tables.join(', ')}`);

    server = app.listen(PORT, () => {
      logger.log(`Server running on port ${PORT}`);
      console.log('(Press CTRL+C to quit)');
    });
  } catch (err) {
    logger.error(err);
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
