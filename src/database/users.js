const validator = require('mysql-validator');
const validateSchema = require('./util/validateSchema');

let typeDescription;

async function validateUser(db, user) {
  const validationErrors = await validateSchema(db, user, 'users');

  return validationErrors;
}

async function getUsers(db) {
  let rows;
  try {
    [rows] = await db.execute('SELECT * FROM users');
  } catch (err) {
    return err;
  }

  if (rows && rows.length) {
    return rows;
  } else {
    return 'No users table found';
  }
}

async function getUser(db, params) {
  let rows;
  try {
    [rows] = await db.execute('SELECT * FROM users WHERE user_id = ?', [
      params.user_id,
    ]);
  } catch (err) {
    return err;
  }

  if (rows && rows.length) {
    return rows;
  } else {
    return `No user found by id ${params.user_id}`;
  }
}

async function createUser(db, params) {
  const testUser = {
    password: 'testpass',
    first_name: 'Michael',
    last_name: 'Beauchemin',
    email: 'michael.beauchemin@gmail.com',
  };

  const validationErrors = await users.validateUser(db, testUser);

  if (validationErrors.length > 0) {
    return `Failed to validate user: ${validationErrors}`;
  }

  let rows;
  try {
    [rows] = await db.execute(
      `INSERT INTO users ( first_name, last_name, email, password ) VALUES ( ?, ?, ?, ? );`,
      [
        testUser.first_name,
        testUser.last_name,
        testUser.email,
        testUser.password,
      ],
    );
  } catch (err) {
    return err;
  }

  if (rows.affectedRows && rows.affectedRows > 0) {
    return `Created user with user_id: ${rows.insertId}`;
  }

  return 'Failed to create user';
}

async function deleteUser() {
  console.log('deleteUser');
}

async function updateUser() {
  console.log('updateUser');
}

module.exports = {
  validateUser,
  getUser,
  getUsers,
  createUser,
  deleteUser,
  updateUser,
};
