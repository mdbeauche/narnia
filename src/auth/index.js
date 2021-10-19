const bcrypt = require('bcrypt');

module.exports = class Auth {
  constructor() {
    this.db = null;
    this.name = 'users';

    this.initialize = this.initialize.bind(this);
    this.findUser = this.findUser.bind(this);
    this.findUserById = this.findUserById.bind(this);
    this.validPassword = this.validPassword.bind(this);
  }

  async initialize(db) {
    // get access to db
    this.db = db;
  }

  async findUser(email) {
    let rows;

    try {
      [rows] = await this.db.execute(
        `SELECT * FROM ${this.name} WHERE email = ?`,
        [email],
      );
    } catch (err) {
      return {};
    }

    if (rows && rows.length) {
      return { user: rows[0] };
    }

    return {};
  }

  async findUserById(id) {
    let rows;

    console.log('inside findUserById');

    try {
      [rows] = await this.db.execute(
        `SELECT * FROM ${this.name} WHERE id = ?`,
        [id],
      );
    } catch (err) {
      return {};
    }

    if (rows && rows.length) {
      return { user: rows[0] };
    }

    return {};
  }

  async validPassword({ user, password }) {
    // check password
    console.log(`comparing ${password} with ${user.password}`);

    const result = await bcrypt.compare(password, user.password);

    console.log('result:', result);

    if (result) {
      // passwords match
      console.log('match');
      return true;
    }

    // passwords don't match
    console.log('no match');
    return false;
  }
};
