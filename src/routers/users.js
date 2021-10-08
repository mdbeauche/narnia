const { users } = require('../database');

const usersRouter = require('express').Router({ mergeParams: true });

let database;

usersRouter
  .route('/')
  .get((req, res) => {
    database.query('SELECT * FROM users', (error, results, fields) => {
      if (error) throw error;

      console.log('GET users: ', results);
      res.send(`GET users: ${results}`);
    });
  })
  .post((req, res) => {});
usersRouter
  .route('/:user_id')
  .get((req, res) => {
    res.send(`GET user ${user_id}`);
  })
  .post((req, res) => {});
usersRouter
  .route('/:user_id/create')
  .get((req, res) => {
    res.send(`GET create user ${user_id}`);
  })
  .post((req, res) => {
    users.validateUser();
  });
usersRouter
  .route('/:user_id/update')
  .get((req, res) => {
    res.send(`GET update user${user_id}`);
  })
  .post((req, res) => {
    users.updateUser();
  });
usersRouter
  .route('/:user_id/delete')
  .get((req, res) => {
    res.send(`GET delete user ${user_id}`);
  })
  .post((req, res) => {
    users.deleteUser();
  });

module.exports = (db) => {
  database = db;

  return usersRouter;
};
