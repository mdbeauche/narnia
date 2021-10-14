// *** ARCHIVED ***
// previous usage:
/*

// initialize schema from db
async function initializeUsers(database) {
  users.initialize(database);
}

const usersRouter = express.Router({ mergeParams: true });

usersRouter.route('/').get(routeHandler(users.getUsers));

usersRouter.route('/create').get(routeHandler(users.createUser));

usersRouter.route('/:id').get(routeHandler(users.getUser));

usersRouter.route('/:id/update').post(routeHandler(users.updateUser));

usersRouter.route('/:id/delete').post(routeHandler(users.deleteUser));

module.exports = { usersRouter, initializeUsers };

*/
// *** ARCHIVED ***

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
    return { success: false, message: `getUsers failed: ${err.message}` };
  }

  if (rows && rows.length) {
    return { success: true, data: rows };
  }

  return { success: false, message: 'No users table found' };
}

async function getUser(db, params) {
  let rows;
  try {
    [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [params.id]);
  } catch (err) {
    return { success: false, message: `getUser failed: ${err.message}` };
  }

  if (rows && rows.length) {
    return { success: true, data: rows };
  }

  return { success: false, message: `No user found by id ${params.id}` };
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
    return {
      success: false,
      message: `Failed to validate user: ${validationErrors}`,
    };
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
    return { success: false, message: `createUser failed: ${err.message}` };
  }

  if (rows.affectedRows && rows.affectedRows > 0) {
    return { success: true, message: `Created user with id: ${rows.insertId}` };
  }

  return { success: false, message: 'Failed to create user' };
}

async function deleteUser(db, params) {
  let rows;
  try {
    [rows] = await db.execute('DELETE FROM users WHERE id = ?;', [params.id]);
  } catch (err) {
    return { success: false, message: `deleteUser failed: ${err.message}` };
  }

  if (rows?.affectedRows > 0) {
    return {
      success: true,
      message: `Deleted ${rows.affectedRows} record${
        rows.affectedRows > 1 ? 's' : ''
      } with id: ${params.id}`,
    };
  }

  return {
    success: false,
    message: `Unable to delete user with id ${params.id}`,
  };
}

async function updateUser(db, params) {
  // testing
  // params.updates = [
  //   { field: 'first_name', value: 'zombified' },
  //   { field: 'last_name', value: 'grumpy' },
  // ];

  const validationErrors = await validateUpdates(schema, params.updates);

  if (validationErrors.length > 0) {
    return {
      success: false,
      message: `Unable to update user due to ${validationErrors}`,
    };
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
      `UPDATE users SET ${updateString} WHERE id = ?;`,
      [...values, params.id],
    );
  } catch (err) {
    return { success: false, message: `updateUser failed: ${err.message}` };
  }

  if (rows && rows.affectedRows > 0) {
    return { success: true, data: rows };
  }

  return {
    success: false,
    message: `Unable to update user with id ${params.id}`,
  };
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
