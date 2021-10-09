const express = require('express');
const routeHandler = require('../util/routeHandler');
const { users } = require('../database');

// initialize schema from db
async function initializeUsers(database) {
  users.initialize(database);
}

const usersRouter = express.Router({ mergeParams: true });

usersRouter.route('/').get(routeHandler(users.getUsers));

usersRouter.route('/create').get(routeHandler(users.createUser));

usersRouter.route('/:user_id').get(routeHandler(users.getUser));

usersRouter.route('/:user_id/update').get(routeHandler(users.updateUser));

usersRouter.route('/:user_id/delete').post(routeHandler(users.deleteUser));

module.exports = { usersRouter, initializeUsers };
