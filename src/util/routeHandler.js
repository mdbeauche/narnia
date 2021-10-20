const asyncHandler = require('express-async-handler');
const logger = require('./logger');

// combine all params associated with express req object
const combineReqParams = (req) => {
  const params = {
    ...req.query,
    ...req.body,
    ...req.params,
    ...req.file,
    ...req.files,
  };

  return params;
};

// combine req parameters, run model function with parameters, send results as json
module.exports = (modelFn) =>
  asyncHandler(async (req, res) => {
    let params;
    try {
      params = combineReqParams(req);

      const results = await modelFn(req.app.db, params);

      let msg = `${req.method} ${req.originalUrl} -> ${modelFn.name} ${
        results.success ? 'SUCCESS' : 'FAIL'
      }:`;

      if (results.data?.length === 1) {
        msg += `${JSON.stringify(results.data[0]).slice(0, 120)}`;
      } else if (results.data?.length > 1) {
        if (Array.isArray(results.data[0]) && results.data[0].length > 0) {
          msg += `${JSON.stringify(results.data[0][0]).slice(0, 120)} and ${
            results.data[0].length - 1
          } more. [${results.data[results.data.length - 1]} total records]`;
        } else {
          msg += `${JSON.stringify(results.data[0]).slice(0, 120)} and ${
            results.data.length - 1
          } more. [${results.data[results.data.length - 1]} total records]`;
        }
      }

      if (results.message !== undefined) {
        msg += ` (${results.message})`;
      }

      logger.log(msg);

      return res.json(results);
    } catch (error) {
      logger.error(
        `Route error at ${req.method} ${
          req.originalUrl
        } -> ${modelFn}: ${error} (params: ${JSON.stringify(params)})`,
      );

      return res.json(error);
    }
  });
