const {
  initializeSchema,
  validateSchema,
  validateUpdates,
} = require('./util/schema');

let schema;

async function initialize(db) {
  schema = await initializeSchema(db, 'users');
}

async function validateUser(db, user) {
  const validationErrors = await validateSchema(db, user, 'users', schema);

  return validationErrors;
}

async function getUsers(db) {
  let rows;
  try {
    [rows] = await db.execute('SELECT * FROM users');
  } catch (err) {
    return `getUsers failed: ${err.message}`;
  }

  if (rows && rows.length) {
    return rows;
  }

  return 'No users table found';
}

async function getUser(db, params) {
  let rows;
  try {
    [rows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [
      params.user_id,
    ]);
  } catch (err) {
    return `getUser failed: ${err.message}`;
  }

  if (rows && rows.length) {
    return rows;
  }

  return `No user found by id ${params.user_id}`;
}

async function createUser(db, params) {
  // testing
  // const testUser = {
  //   password: 'testpass',
  //   first_name: 'Michael',
  //   last_name: 'Beauchemin',
  //   email: 'michael.beauchemin@gmail.com',
  // };

  const validationErrors = await validateUser(db, params.user);

  if (validationErrors.length > 0) {
    return `Failed to validate user: ${validationErrors}`;
  }

  let rows;
  try {
    [rows] = await db.execute(
      `INSERT INTO users ( first_name, last_name, email, password ) VALUES ( ?, ?, ?, ? );`,
      [
        params.user.first_name,
        params.user.last_name,
        params.user.email,
        params.user.password,
      ],
    );
  } catch (err) {
    return `createUser failed: ${err.message}`;
  }

  if (rows.affectedRows && rows.affectedRows > 0) {
    return `Created user with user_id: ${rows.insertId}`;
  }

  return 'Failed to create user';
}

async function deleteUser(db, params) {
  let rows;
  try {
    [rows] = await db.execute('DELETE FROM users WHERE user_id = ?;', [
      params.user_id,
    ]);
  } catch (err) {
    return `deleteUser failed: ${err.message}`;
  }

  if (rows && rows.length) {
    return rows;
  }

  return `Unable to delete user with id ${params.user_id}`;
}

async function updateUser(db, params) {
  // testing
  // params.updates = [
  //   { field: 'first_name', value: 'zombified' },
  //   { field: 'last_name', value: 'grumpy' },
  // ];

  const validationErrors = await validateUpdates(schema, params.updates);

  if (validationErrors.length > 0) {
    return `Unable to update user due to ${validationErrors}`;
  }

  // need to create string of form field1 = value1, field2 = value2
  // difficulty: default escaping only occurs on values, not fields
  let updateString = params.updates.reduce(
    (prev, curr) => `${prev}${curr.field} = ?, `,
    '',
  );
  // remove trailing comma
  updateString = updateString.slice(0, -2);
  const values = params.updates.map((update) => update.value);

  let rows;

  try {
    [rows] = await db.execute(
      `UPDATE users SET ${updateString} WHERE user_id = ?;`,
      [...values, params.user_id],
    );
  } catch (err) {
    return `updateUser failed: ${err.message}`;
  }

  if (rows && rows.affectedRows > 0) {
    return rows;
  }

  return `Unable to update user with id ${params.user_id}`;
}

module.exports = {
  initialize,
  validateUser,
  getUser,
  getUsers,
  createUser,
  deleteUser,
  updateUser,
};
