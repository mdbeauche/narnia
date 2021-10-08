// const validator = require('mysql-validator');

// const err = validator.check('doh winning!', 'varchar(45)');
// if (err) {
//   console.log(err.message);
// }

function validateUser() {
  console.log('validateUser');
}

function createUser() {
  console.log('createUser');
}

function deleteUser() {
  console.log('deleteUser');
}

function updateUser() {
  console.log('updateUser');
}

module.exports = {
  validateUser,
  createUser,
  deleteUser,
  updateUser,
};
