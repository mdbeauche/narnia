const validator = require('mysql-validator');
const logger = require('../../util/logger');

async function initializeSchema(db, table) {
  // initialize Field and Type from db
  let rows;

  try {
    [rows] = await db.execute(`DESCRIBE ${table};`);
  } catch (err) {
    return [err.message];
  }

  const typeDescription = {};

  rows.forEach((row) => {
    // only look at fields that don't have a default value
    // and aren't the primary key
    if (row.Default === null && row.Key !== 'PRI') {
      typeDescription[row.Field] = row.Type;
    }
  });

  return typeDescription;
}

async function validateSchema(db, record, table, schema) {
  // validate data
  const validationErrors = [];
  let types = Object.keys(schema);

  for (const field in record) {
    if (Object.prototype.hasOwnProperty.call(record, field)) {
      // console.log(
      //   `checking field ${field} as (${record[field]}) against ${schema[field]}`,
      // );

      const err = validator.check(record[field], schema[field]);

      if (err) {
        validationErrors.push(err.message);
      } else {
        // remove type from list of types to check
        types = types.filter((type) => type !== field);
      }
    }
  }

  if (types.length > 0) {
    validationErrors.push(`Failed to match all expected types: ${types}`);
  }

  if (validationErrors.length > 0) {
    logger.log(
      `${validationErrors.length} validation error${
        validationErrors.length !== 1 ? 's' : ''
      } found`,
    );

    logger.log(validationErrors);
  }

  return validationErrors;
}

async function validateUpdates(schema, updates) {
  // verify all updates match schema
  if (!updates || updates.length < 1) {
    return `validateUpdates: Missing parameters`;
  }

  const validationErrors = [];

  for (const update of updates) {
    if (!schema[update.field]) {
      validationErrors.push(`field ${update.field} doesn't exist in schema`);
    } else if (update.field && update.value) {
      const err = validator.check(update.value, schema[update.field]);

      if (err) {
        validationErrors.push(err.message);
      }
    }
  }

  if (validationErrors.length > 0) {
    logger.log(
      `${validationErrors.length} validation error${
        validationErrors.length !== 1 ? 's' : ''
      } found`,
    );

    logger.log(validationErrors);
  }

  return validationErrors;
}

module.exports = { initializeSchema, validateSchema, validateUpdates };
