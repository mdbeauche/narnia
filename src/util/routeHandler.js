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

      // log results
      if (Array.isArray(results)) {
        logger.log(
          `${req.method} ${req.originalUrl} -> ${modelFn.name}:${JSON.stringify(
            results[0],
          )}\n... and [${results.length - 1}] more`,
        );
      } else {
        logger.log(
          `${req.method} ${req.originalUrl} -> ${
            modelFn.name
          }: ${JSON.stringify(results)}`,
        );
      }

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
