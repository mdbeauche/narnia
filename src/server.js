const process = require('process');
const express = require('express');
const mysql = require('mysql2');
const {
  PROJECT_NAME,
  PORT,
  DB_NAME,
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
} = require('./config');
const { version } = require('../package.json');
const middleware = require('./util/middleware');
const usersRouter = require('./routers/users');

const app = express();

app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use(express.json());

middleware.forEach((m) => app.use(m));

const database = mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

app.get('/', (req, res) => {
  res.json({
    name: PROJECT_NAME,
    version: version,
    uptime: process.uptime(),
  });
});

app.use('/users', usersRouter(database));

const server = app.listen(PORT, () => {
  database.connect(function (err) {
    if (err) {
      console.error('Error connecting to database: ' + err.stack);
      shutdown();
    }

    console.log('Connected to database as id ' + database.threadId);

    console.log(`Server running on port ${PORT}`);
    console.log('(Press CTRL+C to close)');
  });
});

function shutdown(signal) {
  if (signal) {
    console.log(`\nReceived signal ${signal}`);
  }

  server?.close(() => {
    console.log('HTTP server closed');
  });

  database?.end(() => {
    console.log('Database connection ended');
  });

  console.log('Shutdown complete');

  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGQUIT', shutdown);

process.on('uncaughtException', (err, origin) => {
  console.error(`Caught exception: ${err}`);
  console.error(`Exception origin: ${origin}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
