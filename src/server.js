const process = require('process');
const express = require('express');
const mysql = require('mysql2');
const { PORT } = require('./config');

const app = express();

const database = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '@the3stone4tableC$',
  database: 'narnia',
});

app.get('/', (req, res) => {
  res.send('Hello World');
});

const server = app.listen(PORT, () => {
  database.connect();

  // database.query('SELECT 1 + 1 AS solution', (error, results, fields) => {
  //   if (error) throw error;
  //   console.log('The solution is: ', results[0].solution);
  // });

  database.query('DESCRIBE users', (error, results, fields) => {
    if (error) throw error;
    console.log('The users table is: ', results[0].solution);
    console.log('The fields are: ', fields);
  });

  console.log(`Server running on port ${PORT}`);
  console.log('(Press CTRL+C to close)');
});

function shutdown(signal) {
  console.log(`\nReceived signal ${signal}`);
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
