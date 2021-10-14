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
      if (results.data?.length > 0) {
        msg += `${JSON.stringify(results.data[0])} and ${
          results.data.length
        } more.`;
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
