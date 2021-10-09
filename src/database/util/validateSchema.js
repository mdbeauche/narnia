const validator = require('mysql-validator');

let typeDescription;

async function validateSchema(db, record, table) {
  // initialize Field and Type from db
  if (!typeDescription) {
    // eslint-disable-next-line no-unused-vars
    let rows;

    try {
      [rows] = await db.execute(`DESCRIBE ${table};`);
    } catch (err) {
      return [err.message];
    }

    typeDescription = {};

    rows.forEach((row) => {
      // only look at fields that don't have a default value
      // and aren't the primary key
      if (row['Default'] === null && row['Key'] !== 'PRI') {
        typeDescription[row['Field']] = row['Type'];
      }
    });
  }

  // validate data
  const validationErrors = [];
  let types = Object.keys(typeDescription);

  for (const field in record) {
    if (Object.prototype.hasOwnProperty.call(record, field)) {
      // console.log(
      //   `checking field ${field} as (${record[field]}) against ${typeDescription[field]}`,
      // );

      const err = validator.check(record[field], typeDescription[field]);

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

module.exports = validateSchema;
