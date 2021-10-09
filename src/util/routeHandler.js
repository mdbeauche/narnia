const asyncHandler = require('express-async-handler');
const logger = require('./logger');

// combine all params associated with express req object
const combineReqParams = (req) => {
  const params = Object.assign(
    {},
    req.query,
    req.body,
    req.params,
    req.file,
    req.files,
  );

  return params;
};

// combine req parameters, run model function with parameters, send results as json
module.exports = (modelFn) =>
  asyncHandler(async (req, res) => {
    let params;
    try {
      params = combineReqParams(req);

      const results = await modelFn(req.app.db, params);

      logger.log(results);

      return res.json(results);
    } catch (error) {
      logger.error(
        `Route error at '${req.path}': ${error} (params: ${params})`,
      );

      return res.json(error);
    }
  });
