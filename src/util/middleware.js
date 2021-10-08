const cors = require('cors');
const helmet = require('helmet');
const responseTime = require('response-time');
const timeout = require('timeout-middleware');
const { SERVER_TIMEOUT } = require('../config');

module.exports = [
  cors(),
  helmet(), // helmet: basic express server hardening
  responseTime(), // set 'X-Response-Time' header for response
  timeout(Number(SERVER_TIMEOUT)), // route timeout in ms
];
